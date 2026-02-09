/**
 * Exercise repository — CRUD operations for exercises and their variants.
 *
 * Exercises are the core entities (e.g. "Bench Press").
 * Exercise options are variants of an exercise (e.g. "Barbell", "Dumbbell").
 */
import { executeSqlAsync } from '../db';
import { normalizeName } from '../../utils/normalize';
import type { Exercise, ExerciseOption } from '../../types';

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
