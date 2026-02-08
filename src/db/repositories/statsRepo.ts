import { executeSqlAsync } from '../db';
import type { OverallStats } from '../../types';

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
