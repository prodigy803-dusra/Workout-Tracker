/**
 * Schedule repository — manages workout reminder schedules per template.
 *
 * Each row maps a template to a day of week + time for a push-notification reminder.
 * day_of_week: 0 = Sunday, 1 = Monday, ... 6 = Saturday (matches JS Date.getDay()).
 */
import { executeSqlAsync } from '../db';

export type ScheduleRow = {
  id: number;
  template_id: number;
  day_of_week: number;
  hour: number;
  minute: number;
  enabled: number;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? '';
}

/** List all schedules for a given template. */
export async function listSchedulesForTemplate(templateId: number): Promise<ScheduleRow[]> {
  const res = await executeSqlAsync(
    `SELECT id, template_id, day_of_week, hour, minute, enabled
     FROM template_schedule
     WHERE template_id = ?
     ORDER BY day_of_week;`,
    [templateId]
  );
  return res.rows._array;
}

/** List all enabled schedules across all templates (used for syncing notifications). */
export async function listAllEnabledSchedules(): Promise<(ScheduleRow & { template_name: string })[]> {
  const res = await executeSqlAsync(
    `SELECT ts.id, ts.template_id, ts.day_of_week, ts.hour, ts.minute, ts.enabled,
            t.name as template_name
     FROM template_schedule ts
     JOIN templates t ON t.id = ts.template_id
     WHERE ts.enabled = 1
     ORDER BY ts.day_of_week, ts.hour, ts.minute;`
  );
  return res.rows._array;
}

/** Add or update a schedule for a template on a specific day. */
export async function upsertSchedule(
  templateId: number,
  dayOfWeek: number,
  hour: number,
  minute: number,
  enabled: boolean = true
): Promise<void> {
  await executeSqlAsync(
    `INSERT INTO template_schedule(template_id, day_of_week, hour, minute, enabled, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(template_id, day_of_week)
     DO UPDATE SET hour=excluded.hour, minute=excluded.minute, enabled=excluded.enabled;`,
    [templateId, dayOfWeek, hour, minute, enabled ? 1 : 0, new Date().toISOString()]
  );
}

/** Remove a schedule row. */
export async function deleteSchedule(scheduleId: number): Promise<void> {
  await executeSqlAsync(`DELETE FROM template_schedule WHERE id = ?;`, [scheduleId]);
}

/** Remove all schedules for a template. */
export async function deleteAllSchedulesForTemplate(templateId: number): Promise<void> {
  await executeSqlAsync(`DELETE FROM template_schedule WHERE template_id = ?;`, [templateId]);
}

/** Toggle enabled/disabled for a schedule. */
export async function toggleScheduleEnabled(scheduleId: number, enabled: boolean): Promise<void> {
  await executeSqlAsync(
    `UPDATE template_schedule SET enabled = ? WHERE id = ?;`,
    [enabled ? 1 : 0, scheduleId]
  );
}
