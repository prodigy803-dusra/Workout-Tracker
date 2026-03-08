/**
 * Export all finalised workout sessions to CSV format.
 *
 * Produces one row per set with columns:
 *   Date, Template, Exercise, Set#, Weight (kg), Reps, RPE, Rest (s), Warmup, Notes
 *
 * The file is written to the cache directory and shared via the OS share sheet.
 */
import { executeSqlAsync } from '../db/db';
import { Paths, File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportSessionsCsv(): Promise<void> {
  const res = await executeSqlAsync(
    `SELECT
       s.performed_at,
       t.name AS template_name,
       e.name AS exercise_name,
       st.set_index,
       st.weight,
       st.reps,
       st.rpe,
       st.rest_seconds,
       st.is_warmup,
       s.notes
     FROM sets st
     JOIN session_slot_choices ssc ON ssc.id = st.session_slot_choice_id
     JOIN session_slots ss ON ss.id = ssc.session_slot_id
     JOIN sessions s ON s.id = ss.session_id
     LEFT JOIN templates t ON t.id = s.template_id
     JOIN exercise_options eo ON eo.id = ssc.exercise_option_id
     JOIN exercises e ON e.id = eo.exercise_id
     WHERE s.status = 'final'
     ORDER BY s.performed_at ASC, ss.slot_index ASC, st.set_index ASC;`,
    []
  );

  const headers = ['Date', 'Template', 'Exercise', 'Set #', 'Weight (kg)', 'Reps', 'RPE', 'Rest (s)', 'Warmup', 'Notes'];
  const lines: string[] = [headers.join(',')];

  for (let i = 0; i < res.rows.length; i++) {
    const r = res.rows.item(i);
    const date = r.performed_at ? r.performed_at.slice(0, 10) : '';
    lines.push(
      [
        escapeCsv(date),
        escapeCsv(r.template_name ?? ''),
        escapeCsv(r.exercise_name ?? ''),
        String((r.set_index ?? 0) + 1),
        r.weight != null ? String(r.weight) : '',
        r.reps != null ? String(r.reps) : '',
        r.rpe != null ? String(r.rpe) : '',
        r.rest_seconds != null ? String(r.rest_seconds) : '',
        r.is_warmup ? 'Yes' : 'No',
        escapeCsv(r.notes ?? ''),
      ].join(',')
    );
  }

  const csv = lines.join('\n');
  const csvFile = new ExpoFile(Paths.cache, 'workout_export.csv');
  await csvFile.write(csv);

  await Sharing.shareAsync(csvFile.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Workout Data (CSV)',
    UTI: 'public.comma-separated-values-text',
  });
}
