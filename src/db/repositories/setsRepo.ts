import { executeSqlAsync } from '../db';
import type { SetRow, LastTimeData } from '../../types';

function now() {
  return new Date().toISOString();
}

export async function listSetsForChoice(choiceId: number): Promise<SetRow[]> {
  const res = await executeSqlAsync(
    `SELECT * FROM sets WHERE session_slot_choice_id=? ORDER BY set_index;`,
    [choiceId]
  );
  return res.rows._array;
}

export async function upsertSet(
  choiceId: number,
  setIndex: number,
  weight: number,
  reps: number,
  rpe: number | null,
  notes: string | null,
  restSeconds: number | null = null
) {
  await executeSqlAsync(
    `
    INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, rest_seconds, created_at)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(session_slot_choice_id, set_index)
    DO UPDATE SET weight=excluded.weight, reps=excluded.reps, rpe=excluded.rpe, notes=excluded.notes, rest_seconds=excluded.rest_seconds;
    `,
    [choiceId, setIndex, weight, reps, rpe, notes, restSeconds, now()]
  );
}

export async function deleteSet(choiceId: number, setIndex: number) {
  await executeSqlAsync(
    `DELETE FROM sets WHERE session_slot_choice_id=? AND set_index=?;`,
    [choiceId, setIndex]
  );
}

export async function replaceSetsForChoice(
  choiceId: number,
  rows: Array<{ set_index: number; weight: string; reps: string; rpe: string }>
) {
  await executeSqlAsync(`DELETE FROM sets WHERE session_slot_choice_id=?;`, [choiceId]);
  for (const row of rows) {
    const weight = Number.parseFloat(row.weight);
    const reps = Number.parseInt(row.reps, 10);
    const rpe = row.rpe ? Number.parseFloat(row.rpe) : null;
    if (!Number.isFinite(weight) || weight <= 0) continue;
    if (!Number.isInteger(reps) || reps < 1 || reps > 200) continue;
    if (rpe !== null && (rpe < 1 || rpe > 10 || (rpe * 2) % 1 !== 0)) continue;
    await upsertSet(choiceId, row.set_index, weight, reps, rpe, null);
  }
}

export async function toggleSetCompleted(setId: number, completed: boolean) {
  await executeSqlAsync(
    `UPDATE sets SET completed=? WHERE id=?;`,
    [completed ? 1 : 0, setId]
  );
}

export async function lastTimeForOption(templateSlotOptionId: number): Promise<LastTimeData> {
  const res = await executeSqlAsync(
    `
    SELECT s.performed_at, ssc.id as session_slot_choice_id
    FROM session_slot_choices ssc
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.status='final' AND ssc.template_slot_option_id=?
    ORDER BY s.performed_at DESC, s.id DESC
    LIMIT 1;
    `,
    [templateSlotOptionId]
  );
  if (!res.rows.length) return null;

  const row = res.rows.item(0);
  const sets = await executeSqlAsync(
    `SELECT * FROM sets WHERE session_slot_choice_id=? ORDER BY set_index;`,
    [row.session_slot_choice_id]
  );
  return { performed_at: row.performed_at, sets: sets.rows._array };
}
