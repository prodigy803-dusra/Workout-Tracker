/**
 * Exercise repository — CRUD operations for exercises and their variants.
 *
 * Exercises are the core entities (e.g. "Bench Press").
 * Exercise options are variants of an exercise (e.g. "Barbell", "Dumbbell").
 */
import { executeSqlAsync } from '../db';
import { normalizeName } from '../../utils/normalize';
import type { Exercise, ExerciseOption, ExerciseStats, ExerciseGuideData } from '../../types';

function now() {
  return new Date().toISOString();
}

/** Fetch all exercises ordered alphabetically. */
export async function listExercises(): Promise<Exercise[]> {
  const res = await executeSqlAsync(
    `SELECT id, name, primary_muscle, secondary_muscle, aliases, equipment, movement_pattern,
            video_url, instructions, tips
     FROM exercises ORDER BY name;`
  );
  return res.rows._array;
}

/** Fetch variants for a specific exercise (e.g. Barbell, Dumbbell). */
export async function listExerciseOptions(exerciseId: number): Promise<Pick<ExerciseOption, 'id' | 'name' | 'order_index'>[]> {
  const res = await executeSqlAsync(
    `SELECT id, name, order_index FROM exercise_options
     WHERE exercise_id=? ORDER BY order_index;`,
    [exerciseId]
  );
  return res.rows._array;
}

/** Create a new exercise with the given name. */
export async function createExercise(name: string) {
  await executeSqlAsync(
    `INSERT INTO exercises(name, name_norm, created_at) VALUES (?,?,?);`,
    [name, normalizeName(name), now()]
  );
}

/**
 * Delete an exercise if it's not referenced by any template or session.
 * Returns true if deleted, false if in use.
 */
export async function deleteExercise(exerciseId: number): Promise<boolean> {
  // Check if used in any template slot options
  const tsoRes = await executeSqlAsync(
    `SELECT COUNT(*) as cnt FROM template_slot_options WHERE exercise_id = ?;`,
    [exerciseId]
  );
  if (tsoRes.rows.item(0).cnt > 0) return false;

  // Safe to delete
  await executeSqlAsync(`DELETE FROM exercise_options WHERE exercise_id = ?;`, [exerciseId]);
  await executeSqlAsync(`DELETE FROM exercises WHERE id = ?;`, [exerciseId]);
  return true;
}

/** Add a new variant to an exercise. */
export async function createExerciseOption(
  exerciseId: number,
  name: string,
  orderIndex: number
) {
  await executeSqlAsync(
    `INSERT INTO exercise_options(exercise_id, name, name_norm, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [exerciseId, name, normalizeName(name), orderIndex, now()]
  );
}

/** Bulk-import exercises (and optional variants) from a JSON payload. */
export async function importExercises(payload: {
  exercises: { name: string; options?: string[] }[];
}) {
  for (const ex of payload.exercises) {
    const norm = normalizeName(ex.name);
    const existing = await executeSqlAsync(
      `SELECT id FROM exercises WHERE name_norm=?;`,
      [norm]
    );
    let exId: number;
    if (existing.rows.length) {
      exId = existing.rows.item(0).id;
    } else {
      await executeSqlAsync(
        `INSERT INTO exercises(name, name_norm, created_at) VALUES (?,?,?);`,
        [ex.name, norm, now()]
      );
      const res = await executeSqlAsync(
        `SELECT id FROM exercises WHERE name_norm=?;`,
        [norm]
      );
      exId = res.rows.item(0).id;
    }

    const opts = ex.options || [];
    let order = 0;
    for (const opt of opts) {
      try {
        await executeSqlAsync(
          `INSERT INTO exercise_options(exercise_id, name, name_norm, order_index, created_at)
           VALUES (?,?,?,?,?);`,
          [exId, opt, normalizeName(opt), order, now()]
        );
      } catch {
        // duplicate — skip
      }
      order += 1;
    }
  }
}

/** Fetch guide data (video, instructions, tips) for an exercise. */
export async function getExerciseGuide(exerciseId: number): Promise<ExerciseGuideData> {
  const res = await executeSqlAsync(
    `SELECT video_url, instructions, tips FROM exercises WHERE id = ?;`,
    [exerciseId]
  );
  if (res.rows.length) return res.rows.item(0);
  return { video_url: null, instructions: null, tips: null };
}

/** Aggregate stats (best e1rm, best volume, last performed) for an exercise. */
export async function getExerciseStats(exerciseId: number): Promise<ExerciseStats> {
  const res = await executeSqlAsync(
    `
    SELECT
      MAX(CASE WHEN se.reps BETWEEN 1 AND 12 AND (se.is_warmup = 0 OR se.is_warmup IS NULL) THEN se.weight * (1 + se.reps / 30.0) END) as best_e1rm,
      MAX(CASE WHEN (se.is_warmup = 0 OR se.is_warmup IS NULL) THEN se.weight * se.reps END) as best_volume,
      MAX(s.performed_at) as last_performed
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN sessions s ON s.id = (SELECT session_id FROM session_slots WHERE id = ssc.session_slot_id)
    WHERE tco.exercise_id = ? AND s.status='final';
    `,
    [exerciseId]
  );
  return res.rows.item(0);
}
