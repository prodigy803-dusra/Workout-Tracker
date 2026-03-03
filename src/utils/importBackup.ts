import { executeSqlAsync } from '../db/db';
import { createExercise } from '../db/repositories/exercisesRepo';
import { logBodyWeight } from '../db/repositories/bodyWeightRepo';
// Add other repo imports as needed

export async function importBackup(json: any) {
  // Import exercises
  if (json.exercises) {
    for (const ex of json.exercises) {
      // Check if exercise already exists (by name_norm)
      const res = await executeSqlAsync(
        'SELECT id FROM exercises WHERE name_norm = ?;',
        [ex.name_norm]
      );
      if (!res.rows.length) {
        await createExercise(ex.name);
        // Optionally update other fields
        await executeSqlAsync(
          'UPDATE exercises SET primary_muscle=?, secondary_muscle=?, aliases=?, equipment=?, movement_pattern=?, video_url=?, instructions=?, tips=? WHERE name_norm=?;',
          [ex.primary_muscle, ex.secondary_muscle, ex.aliases, ex.equipment, ex.movement_pattern, ex.video_url, ex.instructions, ex.tips, ex.name_norm]
        );
      }
    }
  }
  // Add similar logic for sessions, sets, body weight, etc.
  // Example for body weight:
  if (json.body_weight) {
    for (const entry of json.body_weight) {
      await logBodyWeight(entry.weight, entry.unit);
    }
  }
  // Repeat for other entities as needed
}

// Usage example:
// importBackup(require('../../../../Downloads/workout_backup.json'));
// importBackup(require('../../../../Downloads/workout_backup (1).json'));
