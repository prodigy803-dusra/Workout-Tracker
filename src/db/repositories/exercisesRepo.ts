import { executeSqlAsync } from '../db';
import { normalizeName } from '../../utils/normalize';
import type { Exercise, ExerciseOption } from '../../types';

function now() {
  return new Date().toISOString();
}

export async function listExercises(): Promise<Exercise[]> {
  const res = await executeSqlAsync(
    `SELECT id, name, primary_muscle, secondary_muscle, aliases, equipment, movement_pattern,
            video_url, instructions, tips
     FROM exercises ORDER BY name;`
  );
  return res.rows._array;
}

export async function listExerciseOptions(exerciseId: number): Promise<Pick<ExerciseOption, 'id' | 'name' | 'order_index'>[]> {
  const res = await executeSqlAsync(
    `SELECT id, name, order_index FROM exercise_options
     WHERE exercise_id=? ORDER BY order_index;`,
    [exerciseId]
  );
  return res.rows._array;
}

export async function createExercise(name: string) {
  await executeSqlAsync(
    `INSERT INTO exercises(name, name_norm, created_at) VALUES (?,?,?);`,
    [name, normalizeName(name), now()]
  );
}

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
