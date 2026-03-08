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

/**
 * Global fallback: get the most recent performed sets for an exercise
 * across ALL templates. Used when no template-specific history exists.
 */
async function getLastPerformedSetsForExercise(exerciseId: number) {
  const choiceRes = await executeSqlAsync(
    `
    SELECT ssc.id
    FROM session_slot_choices ssc
    JOIN template_slot_options tso ON tso.id = ssc.template_slot_option_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions ses ON ses.id = ss.session_id
    WHERE tso.exercise_id = ? AND ses.status = 'final'
    ORDER BY ses.performed_at DESC, ses.id DESC
    LIMIT 1;
    `,
    [exerciseId]
  );

  if (choiceRes.rows.length === 0) {
    return [];
  }

  const choiceId = choiceRes.rows.item(0).id;
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
 *
 * If the user has active injuries, pre-filled weights are reduced according
 * to the injury severity (mild=70%, moderate=50%, severe=0%).
 */
export async function createDraftFromTemplate(templateId: number) {
  // Pre-load active injuries for weight adjustment
  const { listActiveInjuries } = await import('./injuryRepo');
  const { isExerciseAffected, SEVERITY_WEIGHT_FACTOR } = await import('../../data/injuryRegionMap');
  const activeInjuries = await listActiveInjuries();

  let sessionId = 0;
  await db.withTransactionAsync(async () => {
    await executeSqlAsync(
      `INSERT INTO sessions(performed_at, notes, status, template_id, created_at)
       VALUES (?,?,?,?,?);`,
      [now(), null, 'draft', templateId, now()]
    );
    sessionId = await lastInsertRowId();

    const slotsRes = await executeSqlAsync(
      `SELECT id, slot_index, name FROM template_slots
       WHERE template_id=? AND is_hidden=0 ORDER BY slot_index;`,
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

    // Get historical working sets (warmups excluded) — global lookup
    // so weights stay consistent across all templates for the same exercise
    let historicalSets: any[] = [];
    if (defaultOptionId) {
      const exRes = await executeSqlAsync(
        `SELECT exercise_id FROM template_slot_options WHERE id=?;`,
        [defaultOptionId]
      );
      if (exRes.rows.length) {
        historicalSets = await getLastPerformedSetsForExercise(exRes.rows.item(0).exercise_id);
      }
    }
    const prescribedRes = await executeSqlAsync(
      `SELECT set_index, weight, reps, rpe, notes, rest_seconds FROM template_prescribed_sets
       WHERE template_slot_id=? ORDER BY set_index;`,
      [slot.id]
    );
    const prescribedSets = prescribedRes.rows._array;

    // Injury-aware weight reduction: check if this exercise is affected
    let weightFactor = 1;
    if (activeInjuries.length > 0 && defaultOptionId) {
      const exMetaRes = await executeSqlAsync(
        `SELECT e.primary_muscle, e.secondary_muscle, e.movement_pattern
         FROM exercises e JOIN template_slot_options tco ON tco.exercise_id = e.id
         WHERE tco.id = ?;`,
        [defaultOptionId]
      );
      if (exMetaRes.rows.length) {
        const { primary_muscle, secondary_muscle, movement_pattern } = exMetaRes.rows.item(0);
        for (const injury of activeInjuries) {
          if (isExerciseAffected(primary_muscle, secondary_muscle, movement_pattern, injury.body_region)) {
            const factor = SEVERITY_WEIGHT_FACTOR[injury.severity as keyof typeof SEVERITY_WEIGHT_FACTOR] ?? 1;
            weightFactor = Math.min(weightFactor, factor); // use the most restrictive
          }
        }
      }
    }

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
        const rawWeight = hist?.weight ?? ps.weight ?? 0;
        const adjustedWeight = weightFactor < 1
          ? Math.round(rawWeight * weightFactor * 4) / 4  // round to nearest 0.25
          : rawWeight;
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            sscId,
            i + 1,
            adjustedWeight,
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
        const rawWeight = hist.weight ?? 0;
        const adjustedWeight = weightFactor < 1
          ? Math.round(rawWeight * weightFactor * 4) / 4
          : rawWeight;
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            sscId,
            i + 1,
            adjustedWeight,
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

  });
  return sessionId;
}

export async function listDraftSlots(sessionId: number): Promise<DraftSlot[]> {
  const res = await executeSqlAsync(
    `
    SELECT ss.id as session_slot_id, ss.slot_index, ss.name, ss.selected_session_slot_choice_id,
           tco.id as template_slot_option_id, e.id as exercise_id, e.name as exercise_name, eo.name as option_name,
           COALESCE(e.is_assisted, 0) as is_assisted
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

    // Get historical working sets (warmups excluded) — global lookup
    // so weights stay consistent across all templates for the same exercise
    let historicalSets: any[] = [];
    {
      const exRes = await executeSqlAsync(
        `SELECT exercise_id FROM template_slot_options WHERE id=?;`,
        [templateSlotOptionId]
      );
      if (exRes.rows.length) {
        historicalSets = await getLastPerformedSetsForExercise(exRes.rows.item(0).exercise_id);
      }
    }
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
           (SELECT GROUP_CONCAT(name, ', ') FROM (
              SELECT DISTINCT e.name
              FROM session_slots ss
              JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id AND ss.selected_session_slot_choice_id = ssc.id
              JOIN template_slot_options tso ON tso.id = ssc.template_slot_option_id
              JOIN exercises e ON e.id = tso.exercise_id
              WHERE ss.session_id = s.id
            )) as exercises
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

  const dropsRes = await executeSqlAsync(
    `
    SELECT ds.*
    FROM drop_set_segments ds
    JOIN sets se ON se.id = ds.set_id
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    WHERE ss.session_id=?
    ORDER BY ds.set_id, ds.segment_index;
    `,
    [sessionId]
  );

  return {
    session: sRes.rows.item(0),
    slots: slotsRes.rows._array,
    sets: setsRes.rows._array,
    drops: dropsRes.rows._array,
  };
}

/* ═══════════════════════════════════════════════════════════
 *  Mid-workout editing: add / remove exercises
 * ═══════════════════════════════════════════════════════════ */

/**
 * Add an exercise to an active workout session.
 * Creates the necessary template_slot + template_slot_option (for FK integrity),
 * then creates the session_slot + session_slot_choice + 3 default empty sets.
 *
 * @param permanent - if false, the template_slot is marked `is_hidden=1` so it
 *   won't appear in future workouts created from this template.
 */
export async function addExerciseToSession(
  sessionId: number,
  templateId: number,
  exerciseId: number,
  permanent: boolean
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Determine next slot index
    const maxSlotRes = await executeSqlAsync(
      `SELECT COALESCE(MAX(slot_index), 0) + 1 as next_idx
       FROM session_slots WHERE session_id = ?;`,
      [sessionId]
    );
    const nextSlotIndex = maxSlotRes.rows.item(0).next_idx;

    // Also determine next template slot index
    const maxTmplSlotRes = await executeSqlAsync(
      `SELECT COALESCE(MAX(slot_index), 0) + 1 as next_idx
       FROM template_slots WHERE template_id = ?;`,
      [templateId]
    );
    const nextTmplSlotIndex = maxTmplSlotRes.rows.item(0).next_idx;

    // Create template_slot (hidden if one-time)
    await executeSqlAsync(
      `INSERT INTO template_slots(template_id, slot_index, name, is_hidden, created_at)
       VALUES (?,?,NULL,?,?);`,
      [templateId, nextTmplSlotIndex, permanent ? 0 : 1, now()]
    );
    const templateSlotId = await lastInsertRowId();

    // Create template_slot_option
    await executeSqlAsync(
      `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
       VALUES (?,?,NULL,0,?);`,
      [templateSlotId, exerciseId, now()]
    );
    const templateSlotOptionId = await lastInsertRowId();

    // Create session_slot
    await executeSqlAsync(
      `INSERT INTO session_slots(session_id, template_slot_id, slot_index, name, created_at)
       VALUES (?,?,?,NULL,?);`,
      [sessionId, templateSlotId, nextSlotIndex, now()]
    );
    const sessionSlotId = await lastInsertRowId();

    // Create session_slot_choice
    await executeSqlAsync(
      `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at)
       VALUES (?,?,?);`,
      [sessionSlotId, templateSlotOptionId, now()]
    );
    const choiceId = await lastInsertRowId();

    // Select this choice
    await executeSqlAsync(
      `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
      [choiceId, sessionSlotId]
    );

    // Pre-populate with historical data — global lookup
    // so weights stay consistent across all templates for the same exercise
    let historicalSets = await getLastPerformedSetsForExercise(exerciseId);

    if (historicalSets.length > 0) {
      for (let i = 0; i < historicalSets.length; i++) {
        const hist = historicalSets[i];
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [choiceId, i + 1, hist.weight ?? 0, hist.reps ?? 0, hist.rpe, null, hist.rest_seconds ?? 90, 0, now()]
        );
      }
    } else {
      // Default: 3 empty sets
      for (let i = 1; i <= 3; i++) {
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [choiceId, i, 0, 0, null, null, 90, 0, now()]
        );
      }
    }
  });
}

/**
 * Remove an exercise (session_slot) from an active workout.
 * Manually deletes all child rows (drop segments → sets → choices → slot).
 *
 * @param permanent - if true, marks the corresponding template_slot as
 *   `is_hidden=1` so it won't appear in future workouts.
 */
export async function removeExerciseFromSession(
  sessionSlotId: number,
  permanent: boolean
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Get the template_slot_id before we delete anything
    const slotRes = await executeSqlAsync(
      `SELECT template_slot_id FROM session_slots WHERE id = ?;`,
      [sessionSlotId]
    );
    const templateSlotId = slotRes.rows.length ? slotRes.rows.item(0).template_slot_id : null;

    // Get all session_slot_choice ids for this slot
    const choicesRes = await executeSqlAsync(
      `SELECT id FROM session_slot_choices WHERE session_slot_id = ?;`,
      [sessionSlotId]
    );
    const choiceIds = choicesRes.rows._array.map((r: any) => r.id);

    if (choiceIds.length > 0) {
      const ph = choiceIds.map(() => '?').join(',');

      // Get all set ids for these choices
      const setsRes = await executeSqlAsync(
        `SELECT id FROM sets WHERE session_slot_choice_id IN (${ph});`,
        choiceIds
      );
      const setIds = setsRes.rows._array.map((r: any) => r.id);

      // Delete drop segments
      if (setIds.length > 0) {
        const setPh = setIds.map(() => '?').join(',');
        await executeSqlAsync(
          `DELETE FROM drop_set_segments WHERE set_id IN (${setPh});`,
          setIds
        ).catch(() => {});
      }

      // Delete sets
      await executeSqlAsync(
        `DELETE FROM sets WHERE session_slot_choice_id IN (${ph});`,
        choiceIds
      );

      // Delete choices
      await executeSqlAsync(
        `DELETE FROM session_slot_choices WHERE session_slot_id = ?;`,
        [sessionSlotId]
      );
    }

    // Delete session_slot
    await executeSqlAsync(`DELETE FROM session_slots WHERE id = ?;`, [sessionSlotId]);

    // If permanent, hide the template slot from future workouts
    if (permanent && templateSlotId) {
      await executeSqlAsync(
        `UPDATE template_slots SET is_hidden = 1 WHERE id = ?;`,
        [templateSlotId]
      );
    }
  });
}

/**
 * Add a new empty set to a session_slot_choice (for mid-workout "Add Set").
 * Returns the new set_index.
 */
export async function addSetToChoice(choiceId: number): Promise<number> {
  const maxRes = await executeSqlAsync(
    `SELECT COALESCE(MAX(set_index), 0) + 1 as next_idx
     FROM sets WHERE session_slot_choice_id = ?;`,
    [choiceId]
  );
  const nextIndex = maxRes.rows.item(0).next_idx;

  // Copy weight/reps from the last working set if available
  const lastSetRes = await executeSqlAsync(
    `SELECT weight, reps, rpe, rest_seconds FROM sets
     WHERE session_slot_choice_id = ? AND is_warmup = 0
     ORDER BY set_index DESC LIMIT 1;`,
    [choiceId]
  );
  const last = lastSetRes.rows.length ? lastSetRes.rows.item(0) : null;

  await executeSqlAsync(
    `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, is_warmup, created_at)
     VALUES (?,?,?,?,?,?,?,?,0,?);`,
    [
      choiceId,
      nextIndex,
      last?.weight ?? 0,
      last?.reps ?? 0,
      last?.rpe ?? null,
      null,
      last?.rest_seconds ?? 90,
      0,
      now(),
    ]
  );

  return nextIndex;
}

/**
 * Swap the slot_index of two session_slots (for move-up / move-down).
 */
export async function reorderSessionSlots(
  sessionId: number,
  slotIdA: number,
  slotIdB: number
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const aRes = await executeSqlAsync(
      `SELECT slot_index FROM session_slots WHERE id = ? AND session_id = ?;`,
      [slotIdA, sessionId]
    );
    const bRes = await executeSqlAsync(
      `SELECT slot_index FROM session_slots WHERE id = ? AND session_id = ?;`,
      [slotIdB, sessionId]
    );
    if (!aRes.rows.length || !bRes.rows.length) return;
    const idxA = aRes.rows.item(0).slot_index;
    const idxB = bRes.rows.item(0).slot_index;
    // Use -1 as temp to avoid unique constraint collision
    await executeSqlAsync(
      `UPDATE session_slots SET slot_index = -1 WHERE id = ?;`,
      [slotIdA]
    );
    await executeSqlAsync(
      `UPDATE session_slots SET slot_index = ? WHERE id = ?;`,
      [idxA, slotIdB]
    );
    await executeSqlAsync(
      `UPDATE session_slots SET slot_index = ? WHERE id = ?;`,
      [idxB, slotIdA]
    );
  });
}
