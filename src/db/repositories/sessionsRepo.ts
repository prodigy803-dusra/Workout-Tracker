/**
 * Sessions repository — manages workout sessions (drafts + finalized).
 *
 * A session is created as a "draft" from a template. The user logs sets,
 * then finalizes the session to mark it complete. Drafts can also be discarded.
 *
 * Session structure:
 *   Session → SessionSlots → SessionSlotChoices → Sets
 */
import { executeSqlAsync, db, lastInsertRowId } from '../db';
import type { Session, DraftSlot, SlotOption, HistoryItem, SessionDetail } from '../../types';

function now() {
  return new Date().toISOString();
}

/**
 * Get the most recent actual performed sets for a given exercise option.
 * Returns the historical weight/reps/rpe values from the last completed session.
 */
async function getLastPerformedSets(templateSlotOptionId: number) {
  // Find the single most recent session_slot_choice for this exercise
  const choiceRes = await executeSqlAsync(
    `
    SELECT ssc.id
    FROM session_slot_choices ssc
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions ses ON ses.id = ss.session_id
    WHERE ssc.template_slot_option_id = ? AND ses.status = 'final'
    ORDER BY ses.performed_at DESC, ses.id DESC
    LIMIT 1;
    `,
    [templateSlotOptionId]
  );

  if (choiceRes.rows.length === 0) {
    return [];
  }

  const choiceId = choiceRes.rows.item(0).id;

  // Filter out warmup sets — they should never carry across sessions
  const res = await executeSqlAsync(
    `SELECT set_index, weight, reps, rpe, rest_seconds
     FROM sets WHERE session_slot_choice_id = ? AND is_warmup = 0
     ORDER BY set_index ASC;`,
    [choiceId]
  );
  return res.rows._array;
}

/** Get the current in-progress draft session, or null if none exists. */
export async function getActiveDraft(): Promise<Session | null> {
  const res = await executeSqlAsync(
    `SELECT * FROM sessions WHERE status='draft' ORDER BY id DESC LIMIT 1;`
  );
  if (!res.rows.length) return null;
  return res.rows.item(0);
}

/** Delete a draft session and all its associated data. */
export async function discardDraft(sessionId: number) {
  // Manually delete children first (in case foreign_keys wasn't always on)
  // Delete drop-set segments before sets (they reference sets)
  await executeSqlAsync(
    `DELETE FROM drop_set_segments WHERE set_id IN (
      SELECT se.id FROM sets se
      JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
      JOIN session_slots ss ON ss.id = ssc.session_slot_id
      WHERE ss.session_id = ?
    );`,
    [sessionId]
  ).catch(() => { /* table may not exist on older versions */ });
  await executeSqlAsync(
    `DELETE FROM sets WHERE session_slot_choice_id IN (
      SELECT ssc.id FROM session_slot_choices ssc
      JOIN session_slots ss ON ss.id = ssc.session_slot_id
      WHERE ss.session_id = ?
    );`,
    [sessionId]
  );
  await executeSqlAsync(
    `DELETE FROM session_slot_choices WHERE session_slot_id IN (
      SELECT id FROM session_slots WHERE session_id = ?
    );`,
    [sessionId]
  );
  await executeSqlAsync(
    `DELETE FROM session_slots WHERE session_id = ?;`,
    [sessionId]
  );
  await executeSqlAsync(`DELETE FROM sessions WHERE id=?;`, [sessionId]);
}

/** Mark a draft session as finalized with the current timestamp. */
export async function finalizeSession(sessionId: number) {
  await executeSqlAsync(
    `UPDATE sessions SET status='final', performed_at=? WHERE id=?;`,
    [now(), sessionId]
  );
}

/**
 * Create a new draft session from a template.
 * Pre-populates slots, choices, and sets with either historical data
 * (what the user lifted last time) or the template's prescribed sets.
 */
export async function createDraftFromTemplate(templateId: number) {
  return await db.withTransactionAsync(async () => {
    await executeSqlAsync(
      `INSERT INTO sessions(performed_at, notes, status, template_id, created_at)
       VALUES (?,?,?,?,?);`,
      [now(), null, 'draft', templateId, now()]
    );
    const sessionId = await lastInsertRowId();

    const slotsRes = await executeSqlAsync(
      `SELECT id, slot_index, name FROM template_slots
       WHERE template_id=? ORDER BY slot_index;`,
      [templateId]
    );
    const slots = slotsRes.rows._array;

    for (const slot of slots) {
    await executeSqlAsync(
      `INSERT INTO session_slots(session_id, template_slot_id, slot_index, name, created_at)
       VALUES (?,?,?,?,?);`,
      [sessionId, slot.id, slot.slot_index, slot.name, now()]
    );
    const sessionSlotId = await lastInsertRowId();

    const lastSelected = await executeSqlAsync(
      `
      SELECT tco.id AS template_slot_option_id
      FROM session_slots ss
      JOIN sessions s ON s.id = ss.session_id
      JOIN session_slot_choices ssc ON ssc.id = ss.selected_session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      WHERE s.status='final' AND s.template_id = ? AND ss.slot_index = ?
      ORDER BY s.performed_at DESC, s.id DESC, ss.id DESC
      LIMIT 1;
      `,
      [templateId, slot.slot_index]
    );

    let defaultOptionId: number | null = null;
    if (lastSelected.rows.length) {
      const candidate = lastSelected.rows.item(0).template_slot_option_id;
      const exists = await executeSqlAsync(
        `SELECT id FROM template_slot_options WHERE template_slot_id=? AND id=?;`,
        [slot.id, candidate]
      );
      if (exists.rows.length) defaultOptionId = candidate;
    }

    if (!defaultOptionId) {
      const first = await executeSqlAsync(
        `SELECT id FROM template_slot_options WHERE template_slot_id=? ORDER BY order_index LIMIT 1;`,
        [slot.id]
      );
      if (first.rows.length === 0) {
        // No exercises in this slot - skip it
        await executeSqlAsync(`DELETE FROM session_slots WHERE id=?;`, [sessionSlotId]);
        continue;
      }
      defaultOptionId = first.rows.item(0).id;
    }

    await executeSqlAsync(
      `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at)
       VALUES (?,?,?);`,
      [sessionSlotId, defaultOptionId, now()]
    );
    const sscId = await lastInsertRowId();

    await executeSqlAsync(
      `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
      [sscId, sessionSlotId]
    );

    // Get historical working sets (warmups excluded) and prescribed sets
    const historicalSets = await getLastPerformedSets(defaultOptionId);
    const prescribedRes = await executeSqlAsync(
      `SELECT set_index, weight, reps, rpe, notes, rest_seconds FROM template_prescribed_sets
       WHERE template_slot_id=? ORDER BY set_index;`,
      [slot.id]
    );
    const prescribedSets = prescribedRes.rows._array;

    if (prescribedSets.length > 0) {
      // Template prescribed sets define the STRUCTURE (number of sets).
      // Historical data fills in weight/reps from last session.
      // Take the last N historical sets (working sets are at the end, warmups at the start).
      const workingHistory = historicalSets.length > 0
        ? historicalSets.slice(-prescribedSets.length)
        : [];

      for (let i = 0; i < prescribedSets.length; i++) {
        const ps = prescribedSets[i];
        const hist = workingHistory[i];
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            sscId,
            i + 1,
            hist?.weight ?? ps.weight ?? 0,
            hist?.reps ?? ps.reps ?? 0,
            hist?.rpe ?? ps.rpe,
            ps.notes,
            hist?.rest_seconds ?? ps.rest_seconds ?? 90,
            0,
            now(),
          ]
        );
      }
    } else if (historicalSets.length > 0) {
      // No prescribed sets — use history directly (warmups already filtered)
      for (let i = 0; i < historicalSets.length; i++) {
        const hist = historicalSets[i];
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            sscId,
            i + 1,
            hist.weight ?? 0,
            hist.reps ?? 0,
            hist.rpe,
            null,
            hist.rest_seconds ?? 90,
            0,
            now(),
          ]
        );
      }
    }
    }

    return sessionId;
  });
}

export async function listDraftSlots(sessionId: number): Promise<DraftSlot[]> {
  const res = await executeSqlAsync(
    `
    SELECT ss.id as session_slot_id, ss.slot_index, ss.name, ss.selected_session_slot_choice_id,
           tco.id as template_slot_option_id, e.id as exercise_id, e.name as exercise_name, eo.name as option_name
    FROM session_slots ss
    LEFT JOIN session_slot_choices ssc ON ssc.id = ss.selected_session_slot_choice_id
    LEFT JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    LEFT JOIN exercises e ON e.id = tco.exercise_id
    LEFT JOIN exercise_options eo ON eo.id = tco.exercise_option_id
    WHERE ss.session_id=?
    ORDER BY ss.slot_index;
    `,
    [sessionId]
  );
  return res.rows._array;
}

export async function listSlotOptions(sessionSlotId: number): Promise<SlotOption[]> {
  const res = await executeSqlAsync(
    `
    SELECT ssc.id as session_slot_choice_id, tco.id as template_slot_option_id,
           e.name as exercise_name, eo.name as option_name, tco.order_index
    FROM session_slots ss
    JOIN template_slot_options tco ON tco.template_slot_id = ss.template_slot_id
    JOIN exercises e ON e.id = tco.exercise_id
    LEFT JOIN exercise_options eo ON eo.id = tco.exercise_option_id
    LEFT JOIN session_slot_choices ssc
      ON ssc.session_slot_id = ss.id AND ssc.template_slot_option_id = tco.id
    WHERE ss.id=?
    ORDER BY tco.order_index;
    `,
    [sessionSlotId]
  );
  return res.rows._array;
}

export async function selectSlotChoice(
  sessionSlotId: number,
  templateSlotOptionId: number
) {
  const existing = await executeSqlAsync(
    `SELECT id FROM session_slot_choices WHERE session_slot_id=? AND template_slot_option_id=?;`,
    [sessionSlotId, templateSlotOptionId]
  );
  let choiceId: number;
  if (existing.rows.length) {
    choiceId = existing.rows.item(0).id;
  } else {
    await executeSqlAsync(
      `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at)
       VALUES (?,?,?);`,
      [sessionSlotId, templateSlotOptionId, now()]
    );
    choiceId = await lastInsertRowId();

    // Get historical working sets (warmups excluded) and prescribed sets
    const historicalSets = await getLastPerformedSets(templateSlotOptionId);
    const slotRes = await executeSqlAsync(
      `SELECT template_slot_id FROM session_slots WHERE id=?;`,
      [sessionSlotId]
    );
    const templateSlotId = slotRes.rows.length ? slotRes.rows.item(0).template_slot_id : null;
    const prescribedRes = templateSlotId ? await executeSqlAsync(
      `SELECT set_index, weight, reps, rpe, notes, rest_seconds FROM template_prescribed_sets
       WHERE template_slot_id=? ORDER BY set_index;`,
      [templateSlotId]
    ) : null;
    const prescribedSets = prescribedRes?.rows._array ?? [];

    if (prescribedSets.length > 0) {
      // Template prescribed sets define the structure
      const workingHistory = historicalSets.length > 0
        ? historicalSets.slice(-prescribedSets.length)
        : [];

      for (let i = 0; i < prescribedSets.length; i++) {
        const ps = prescribedSets[i];
        const hist = workingHistory[i];
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            choiceId,
            i + 1,
            hist?.weight ?? ps.weight ?? 0,
            hist?.reps ?? ps.reps ?? 0,
            hist?.rpe ?? ps.rpe,
            ps.notes,
            hist?.rest_seconds ?? ps.rest_seconds ?? 90,
            0,
            now(),
          ]
        );
      }
    } else if (historicalSets.length > 0) {
      // No prescribed sets — use history directly (warmups already filtered)
      for (let i = 0; i < historicalSets.length; i++) {
        const hist = historicalSets[i];
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            choiceId,
            i + 1,
            hist.weight ?? 0,
            hist.reps ?? 0,
            hist.rpe,
            null,
            hist.rest_seconds ?? 90,
            0,
            now(),
          ]
        );
      }
    }
  }
  await executeSqlAsync(
    `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
    [choiceId, sessionSlotId]
  );
  return choiceId;
}

export async function listHistory(): Promise<HistoryItem[]> {
  const res = await executeSqlAsync(
    `
    SELECT s.id, s.performed_at, s.created_at, s.notes, t.name as template_name,
           (SELECT COUNT(*) FROM session_slots ss WHERE ss.session_id = s.id) as slots_count,
           (SELECT COUNT(*) FROM sets se
            JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
            JOIN session_slots ss ON ss.id = ssc.session_slot_id
            WHERE ss.session_id = s.id AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL)) as completed_sets_count,
           (SELECT COUNT(*) FROM sets se
            JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
            JOIN session_slots ss ON ss.id = ssc.session_slot_id
            WHERE ss.session_id = s.id AND (se.is_warmup = 0 OR se.is_warmup IS NULL)) as sets_count,
           (SELECT COALESCE(SUM(se.weight * se.reps),0) FROM sets se
            JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
            JOIN session_slots ss ON ss.id = ssc.session_slot_id
            WHERE ss.session_id = s.id AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL)) as total_volume,
           (SELECT GROUP_CONCAT(DISTINCT e.name, ', ')
            FROM session_slots ss
            JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id AND ss.selected_session_slot_choice_id = ssc.id
            JOIN template_slot_options tso ON tso.id = ssc.template_slot_option_id
            JOIN exercises e ON e.id = tso.exercise_id
            WHERE ss.session_id = s.id) as exercises
    FROM sessions s
    LEFT JOIN templates t ON t.id = s.template_id
    WHERE s.status='final'
    ORDER BY s.performed_at DESC, s.id DESC;
    `
  );
  return res.rows._array;
}

export async function getSessionDetail(sessionId: number): Promise<SessionDetail> {
  const sRes = await executeSqlAsync(
    `SELECT s.id, s.performed_at, s.notes, t.name as template_name
     FROM sessions s LEFT JOIN templates t ON t.id = s.template_id WHERE s.id=?;`,
    [sessionId]
  );

  const slotsRes = await executeSqlAsync(
    `
    SELECT ss.id as session_slot_id, ss.slot_index, ss.name, ssc.id as session_slot_choice_id,
           tco.id as template_slot_option_id, e.name as exercise_name, eo.name as option_name
    FROM session_slots ss
    JOIN session_slot_choices ssc ON ssc.id = ss.selected_session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tco.exercise_id
    LEFT JOIN exercise_options eo ON eo.id = tco.exercise_option_id
    WHERE ss.session_id=?
    ORDER BY ss.slot_index;
    `,
    [sessionId]
  );

  const setsRes = await executeSqlAsync(
    `
    SELECT se.*, ssc.id as session_slot_choice_id
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    WHERE ss.session_id=?
    ORDER BY se.session_slot_choice_id, se.set_index;
    `,
    [sessionId]
  );

  return {
    session: sRes.rows.item(0),
    slots: slotsRes.rows._array,
    sets: setsRes.rows._array,
  };
}
