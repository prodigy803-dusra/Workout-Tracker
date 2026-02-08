import { executeSqlAsync, db } from '../db';

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

  const res = await executeSqlAsync(
    `SELECT set_index, weight, reps, rpe, rest_seconds
     FROM sets WHERE session_slot_choice_id = ?
     ORDER BY set_index ASC;`,
    [choiceId]
  );
  return res.rows._array;
}

export async function getActiveDraft() {
  const res = await executeSqlAsync(
    `SELECT * FROM sessions WHERE status='draft' ORDER BY id DESC LIMIT 1;`
  );
  if (!res.rows.length) return null;
  return res.rows.item(0);
}

export async function discardDraft(sessionId: number) {
  await executeSqlAsync(`DELETE FROM sessions WHERE id=?;`, [sessionId]);
}

export async function finalizeSession(sessionId: number) {
  await executeSqlAsync(
    `UPDATE sessions SET status='final', performed_at=? WHERE id=?;`,
    [now(), sessionId]
  );
}

export async function createDraftFromTemplate(templateId: number) {
  return await db.withTransactionAsync(async () => {
    await executeSqlAsync(
      `INSERT INTO sessions(performed_at, notes, status, template_id, created_at)
       VALUES (?,?,?,?,?);`,
      [now(), null, 'draft', templateId, now()]
    );
    const sRes = await executeSqlAsync(
      `SELECT id FROM sessions ORDER BY id DESC LIMIT 1;`
    );
    const sessionId = sRes.rows.item(0).id;

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
    const ssRes = await executeSqlAsync(
      `SELECT id FROM session_slots ORDER BY id DESC LIMIT 1;`
    );
    const sessionSlotId = ssRes.rows.item(0).id;

    const lastSelected = await executeSqlAsync(
      `
      SELECT tco.id AS template_slot_option_id
      FROM session_slots ss
      JOIN sessions s ON s.id = ss.session_id
      JOIN session_slot_choices ssc ON ssc.id = ss.selected_session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      WHERE s.status='final' AND ss.slot_index = ?
      ORDER BY s.performed_at DESC, s.id DESC, ss.id DESC
      LIMIT 1;
      `,
      [slot.slot_index]
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
    const sscRes = await executeSqlAsync(
      `SELECT id FROM session_slot_choices ORDER BY id DESC LIMIT 1;`
    );
    const sscId = sscRes.rows.item(0).id;

    await executeSqlAsync(
      `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
      [sscId, sessionSlotId]
    );

    // Try to get historical data for this exercise first
    const historicalSets = await getLastPerformedSets(defaultOptionId);
    
    if (historicalSets.length > 0) {
      // Use actual historical data from last time this exercise was performed
      for (const hist of historicalSets) {
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            sscId,
            hist.set_index,
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
    } else {
      // Fallback: Copy prescribed sets from template slot if no history exists
      const prescribedSets = await executeSqlAsync(
        `SELECT set_index, weight, reps, rpe, notes, rest_seconds FROM template_prescribed_sets
         WHERE template_slot_id=? ORDER BY set_index;`,
        [slot.id]
      );
      for (let i = 0; i < prescribedSets.rows.length; i++) {
        const ps = prescribedSets.rows.item(i);
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            sscId,
            ps.set_index,
            ps.weight ?? 0,
            ps.reps ?? 0,
            ps.rpe,
            ps.notes,
            ps.rest_seconds ?? 90,
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

export async function listDraftSlots(sessionId: number) {
  const res = await executeSqlAsync(
    `
    SELECT ss.id as session_slot_id, ss.slot_index, ss.name, ss.selected_session_slot_choice_id,
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
  return res.rows._array;
}

export async function listSlotOptions(sessionSlotId: number) {
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
    const res = await executeSqlAsync(
      `SELECT id FROM session_slot_choices ORDER BY id DESC LIMIT 1;`
    );
    choiceId = res.rows.item(0).id;

    // Try to get historical data for this exercise first
    const historicalSets = await getLastPerformedSets(templateSlotOptionId);

    if (historicalSets.length > 0) {
      // Use actual historical data from last time this exercise was performed
      for (const hist of historicalSets) {
        await executeSqlAsync(
          `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
           VALUES (?,?,?,?,?,?,?,?,?);`,
          [
            choiceId,
            hist.set_index,
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
    } else {
      // Fallback: Copy prescribed sets from template slot to the new choice
      const slotRes = await executeSqlAsync(
        `SELECT template_slot_id FROM session_slots WHERE id=?;`,
        [sessionSlotId]
      );
      if (slotRes.rows.length) {
        const templateSlotId = slotRes.rows.item(0).template_slot_id;
        const prescribedSets = await executeSqlAsync(
          `SELECT set_index, weight, reps, rpe, notes, rest_seconds FROM template_prescribed_sets
           WHERE template_slot_id=? ORDER BY set_index;`,
          [templateSlotId]
        );
        for (let i = 0; i < prescribedSets.rows.length; i++) {
          const ps = prescribedSets.rows.item(i);
          await executeSqlAsync(
            `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, completed, created_at)
             VALUES (?,?,?,?,?,?,?,?,?);`,
            [
              choiceId,
              ps.set_index,
              ps.weight ?? 0,
              ps.reps ?? 0,
              ps.rpe,
              ps.notes,
              ps.rest_seconds ?? 90,
              0,
              now(),
            ]
          );
        }
      }
    }
  }
  await executeSqlAsync(
    `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
    [choiceId, sessionSlotId]
  );
  return choiceId;
}

export async function listHistory() {
  const res = await executeSqlAsync(
    `
    SELECT s.id, s.performed_at, t.name as template_name,
           (SELECT COUNT(*) FROM session_slots ss WHERE ss.session_id = s.id) as slots_count,
           (SELECT COUNT(*) FROM sets se
            JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
            JOIN session_slots ss ON ss.id = ssc.session_slot_id
            WHERE ss.session_id = s.id) as sets_count,
           (SELECT COALESCE(SUM(se.weight * se.reps),0) FROM sets se
            JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
            JOIN session_slots ss ON ss.id = ssc.session_slot_id
            WHERE ss.session_id = s.id) as total_volume
    FROM sessions s
    LEFT JOIN templates t ON t.id = s.template_id
    WHERE s.status='final'
    ORDER BY s.performed_at DESC, s.id DESC;
    `
  );
  return res.rows._array;
}

export async function getSessionDetail(sessionId: number) {
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
