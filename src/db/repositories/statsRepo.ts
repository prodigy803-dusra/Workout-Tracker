/**
 * Stats repository — aggregate queries for dashboard and exercise analytics.
 */
import { executeSqlAsync, db } from '../db';
import type { OverallStats, MuscleVolumeRow, WorkoutDay } from '../../types';
import type { DataPoint } from '../../components/TrendChart';

/**
 * Get the estimated 1RM (Epley formula) for an exercise across all sessions.
 * Used to render the trend chart on the Exercise Detail screen.
 */
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
      AND se.is_warmup = 0
    GROUP BY s.id
    ORDER BY s.performed_at ASC;
    `,
    [exerciseId]
  );
  return res.rows._array;
}

/** Fetch high-level stats: total sessions + last-7-day summary. */
export async function overallStats(): Promise<OverallStats> {
  const totalSessions = await executeSqlAsync(
    `SELECT COUNT(*) as c FROM sessions WHERE status='final';`
  );
  const last7 = await executeSqlAsync(
    `
    SELECT
      COUNT(DISTINCT s.id) as sessionsCount,
      COUNT(CASE WHEN se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL) THEN se.id END) as setsCount,
      COALESCE(SUM(CASE WHEN se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL) THEN se.weight * se.reps ELSE 0 END),0) as totalVolume
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

/** Volume and session count per template. */
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

/* ═══════════════════════════════════════════════════════════
 *  Personal Records (PRs)
 * ═══════════════════════════════════════════════════════════ */

/**
 * Detect and record PRs for a just-finalized session.
 * Checks each exercise for new best e1RM and heaviest weight.
 * Returns the list of new PRs found.
 */
export async function detectAndRecordPRs(sessionId: number) {
  const now = new Date().toISOString();

  // Get all exercises performed in this session
  const exercisesRes = await executeSqlAsync(
    `
    SELECT DISTINCT tco.exercise_id, e.name as exercise_name
    FROM session_slots ss
    JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tco.exercise_id
    WHERE ss.session_id = ?;
    `,
    [sessionId]
  );

  const prs: Array<{ exercise_name: string; pr_type: string; value: number; previous_value: number | null }> = [];

  for (const ex of exercisesRes.rows._array) {
    // Best e1RM from THIS session
    const thisE1rm = await executeSqlAsync(
      `
      SELECT MAX(se.weight * (1 + se.reps / 30.0)) as best
      FROM sets se
      JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      JOIN session_slots ss ON ss.id = ssc.session_slot_id
      WHERE ss.session_id = ? AND tco.exercise_id = ?
        AND se.completed = 1 AND se.reps BETWEEN 1 AND 12 AND se.weight > 0
        AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
      `,
      [sessionId, ex.exercise_id]
    );
    const currentE1rm = thisE1rm.rows.item(0)?.best;

    // Best e1RM from ALL PREVIOUS sessions (excluding this one)
    const prevE1rm = await executeSqlAsync(
      `
      SELECT MAX(se.weight * (1 + se.reps / 30.0)) as best
      FROM sets se
      JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      JOIN session_slots ss ON ss.id = ssc.session_slot_id
      JOIN sessions s ON s.id = ss.session_id
      WHERE s.status = 'final' AND s.id != ? AND tco.exercise_id = ?
        AND se.completed = 1 AND se.reps BETWEEN 1 AND 12 AND se.weight > 0
        AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
      `,
      [sessionId, ex.exercise_id]
    );
    const previousE1rm = prevE1rm.rows.item(0)?.best;

    if (currentE1rm && (!previousE1rm || currentE1rm > previousE1rm)) {
      await executeSqlAsync(
        `INSERT INTO personal_records(exercise_id, session_id, pr_type, value, previous_value, created_at)
         VALUES (?,?,?,?,?,?);`,
        [ex.exercise_id, sessionId, 'e1rm', currentE1rm, previousE1rm || null, now]
      );
      prs.push({
        exercise_name: ex.exercise_name,
        pr_type: 'e1rm',
        value: currentE1rm,
        previous_value: previousE1rm || null,
      });
    }

    // Best weight from THIS session
    const thisWeight = await executeSqlAsync(
      `
      SELECT MAX(se.weight) as best
      FROM sets se
      JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      JOIN session_slots ss ON ss.id = ssc.session_slot_id
      WHERE ss.session_id = ? AND tco.exercise_id = ?
        AND se.completed = 1 AND se.weight > 0
        AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
      `,
      [sessionId, ex.exercise_id]
    );
    const currentWeight = thisWeight.rows.item(0)?.best;

    const prevWeight = await executeSqlAsync(
      `
      SELECT MAX(se.weight) as best
      FROM sets se
      JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      JOIN session_slots ss ON ss.id = ssc.session_slot_id
      JOIN sessions s ON s.id = ss.session_id
      WHERE s.status = 'final' AND s.id != ? AND tco.exercise_id = ?
        AND se.completed = 1 AND se.weight > 0
        AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
      `,
      [sessionId, ex.exercise_id]
    );
    const previousWeight = prevWeight.rows.item(0)?.best;

    if (currentWeight && (!previousWeight || currentWeight > previousWeight)) {
      await executeSqlAsync(
        `INSERT INTO personal_records(exercise_id, session_id, pr_type, value, previous_value, created_at)
         VALUES (?,?,?,?,?,?);`,
        [ex.exercise_id, sessionId, 'weight', currentWeight, previousWeight || null, now]
      );
      prs.push({
        exercise_name: ex.exercise_name,
        pr_type: 'weight',
        value: currentWeight,
        previous_value: previousWeight || null,
      });
    }
  }

  return prs;
}

/** Get PRs for a specific session (for the summary screen). */
export async function getSessionPRs(sessionId: number) {
  const res = await executeSqlAsync(
    `
    SELECT pr.*, e.name as exercise_name
    FROM personal_records pr
    JOIN exercises e ON e.id = pr.exercise_id
    WHERE pr.session_id = ?
    ORDER BY pr.pr_type, e.name;
    `,
    [sessionId]
  );
  return res.rows._array;
}

/** Check if a session has any PRs (for badge display in history). */
export async function sessionHasPRs(sessionId: number): Promise<boolean> {
  const res = await executeSqlAsync(
    `SELECT COUNT(*) as c FROM personal_records WHERE session_id = ?;`,
    [sessionId]
  );
  return res.rows.item(0).c > 0;
}

/** Get PR count for each session in bulk (for history list). */
export async function prCountsBySession(): Promise<Record<number, number>> {
  const res = await executeSqlAsync(
    `SELECT session_id, COUNT(*) as c FROM personal_records GROUP BY session_id;`
  );
  const map: Record<number, number> = {};
  for (const row of res.rows._array) {
    map[row.session_id] = row.c;
  }
  return map;
}

/* ═══════════════════════════════════════════════════════════
 *  Weekly Volume by Muscle Group
 * ═══════════════════════════════════════════════════════════ */

/** Get sets and volume per muscle group for the last 7 days. */
export async function weeklyVolumeByMuscle(): Promise<MuscleVolumeRow[]> {
  const res = await executeSqlAsync(
    `
    SELECT e.primary_muscle as muscle,
           COUNT(se.id) as sets,
           COALESCE(SUM(se.weight * se.reps), 0) as volume
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tco.exercise_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.status = 'final'
      AND s.performed_at >= datetime('now', '-7 days')
      AND se.completed = 1
      AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
      AND e.primary_muscle IS NOT NULL
    GROUP BY e.primary_muscle
    ORDER BY sets DESC;
    `
  );
  return res.rows._array;
}

/* ═══════════════════════════════════════════════════════════
 *  Training Streak & Calendar
 * ═══════════════════════════════════════════════════════════ */

/** Get workout days map (date → count) for heatmap. */
export async function workoutDaysMap(): Promise<Record<string, number>> {
  const res = await executeSqlAsync(
    `
    SELECT DATE(performed_at) as date, COUNT(*) as count
    FROM sessions
    WHERE status = 'final'
    GROUP BY DATE(performed_at)
    ORDER BY date;
    `
  );
  const map: Record<string, number> = {};
  for (const row of res.rows._array) {
    map[row.date] = row.count;
  }
  return map;
}

/** Calculate the current consecutive-day training streak. */
export async function currentStreak(): Promise<number> {
  const res = await executeSqlAsync(
    `
    SELECT DISTINCT DATE(performed_at) as date
    FROM sessions
    WHERE status = 'final'
    ORDER BY date DESC;
    `
  );
  if (res.rows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Allow starting from today or yesterday
  const latest = new Date(res.rows.item(0).date + 'T00:00:00');
  const diffDays = Math.floor((today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return 0; // More than 1 day gap — streak broken

  const dateSet = new Set<string>();
  for (const row of res.rows._array) {
    dateSet.add(row.date);
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      // Today might not have a workout yet — check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
