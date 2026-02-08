import { executeSqlAsync } from '../db';
import type { OverallStats } from '../../types';
import type { DataPoint } from '../../components/TrendChart';

export async function e1rmHistory(exerciseId: number): Promise<DataPoint[]> {
  const res = await executeSqlAsync(
    `
    SELECT s.performed_at as date,
           MAX(se.weight * (1 + se.reps / 30.0)) as value
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE tco.exercise_id = ? AND s.status='final'
      AND se.reps BETWEEN 1 AND 12 AND se.weight > 0 AND se.completed = 1
    GROUP BY s.id
    ORDER BY s.performed_at ASC;
    `,
    [exerciseId]
  );
  return res.rows._array;
}

export async function overallStats(): Promise<OverallStats> {
  const totalSessions = await executeSqlAsync(
    `SELECT COUNT(*) as c FROM sessions WHERE status='final';`
  );
  const last7 = await executeSqlAsync(
    `
    SELECT
      COUNT(DISTINCT s.id) as sessionsCount,
      COUNT(se.id) as setsCount,
      COALESCE(SUM(se.weight * se.reps),0) as totalVolume
    FROM sessions s
    LEFT JOIN session_slots ss ON ss.session_id = s.id
    LEFT JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
    LEFT JOIN sets se ON se.session_slot_choice_id = ssc.id
    WHERE s.status='final' AND s.performed_at >= datetime('now','-7 days');
    `
  );
  return {
    totalSessions: totalSessions.rows.item(0).c,
    last7: last7.rows.item(0),
  };
}

export async function perTemplateStats() {
  const res = await executeSqlAsync(
    `
    SELECT t.id, t.name,
           COUNT(DISTINCT s.id) as sessionsCount,
           COUNT(se.id) as totalSets,
           COALESCE(SUM(se.weight * se.reps),0) as totalVolume
    FROM templates t
    LEFT JOIN sessions s ON s.template_id = t.id AND s.status='final'
    LEFT JOIN session_slots ss ON ss.session_id = s.id
    LEFT JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
    LEFT JOIN sets se ON se.session_slot_choice_id = ssc.id
    GROUP BY t.id, t.name
    ORDER BY t.name;
    `
  );
  return res.rows._array;
}
