/**
 * Stats repository — aggregate queries for dashboard and exercise analytics.
 */
import { executeSqlAsync, db } from '../db';
import type { OverallStats, MuscleVolumeRow, WorkoutDay } from '../../types';
import type { DataPoint } from '../../components/TrendChart';

/**
 * Effort / rest-time stats for a session, computed from completed_at timestamps.
 */
export type SessionEffortStats = {
  /** Total rest time in seconds (sum of gaps between consecutive completed sets). */
  totalRestSecs: number;
  /** Average rest time per inter-set gap in seconds. */
  avgRestSecs: number;
  /** Number of inter-set gaps used for calculation. */
  gapCount: number;
  /** Workout density: completed working sets per minute of total workout time. */
  setsPerMinute: number;
  /** Workout density: volume (kg) per minute of total workout time. */
  volumePerMinute: number;
  /** True if enough completed_at data exists (≥2 sets with timestamps). */
  hasData: boolean;
};

/**
 * Compute effort/rest-time stats from completed_at timestamps on sets.
 * Only considers working sets (is_warmup=0) with non-null completed_at.
 * Returns hasData=false if fewer than 2 sets have timestamps.
 */
export async function sessionEffortStats(
  sessionId: number,
  durationSecs?: number
): Promise<SessionEffortStats> {
  const empty: SessionEffortStats = {
    totalRestSecs: 0, avgRestSecs: 0, gapCount: 0,
    setsPerMinute: 0, volumePerMinute: 0, hasData: false,
  };

  // Get all completed working sets with timestamps, ordered chronologically
  const res = await executeSqlAsync(
    `
    SELECT se.completed_at, se.weight, se.reps,
           COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0) as drop_volume
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    WHERE ss.session_id = ?
      AND se.completed = 1
      AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
      AND se.completed_at IS NOT NULL
    ORDER BY se.completed_at ASC;
    `,
    [sessionId]
  );

  const rows = res.rows._array;
  if (rows.length < 2) return empty;

  // Calculate inter-set gaps
  let totalRestMs = 0;
  let gapCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].completed_at).getTime();
    const curr = new Date(rows[i].completed_at).getTime();
    if (!isNaN(prev) && !isNaN(curr) && curr > prev) {
      totalRestMs += curr - prev;
      gapCount++;
    }
  }

  if (gapCount === 0) return empty;

  const totalRestSecs = Math.round(totalRestMs / 1000);
  const avgRestSecs = Math.round(totalRestSecs / gapCount);

  // Density: use provided duration if available, otherwise span of timestamps
  const totalVolume = rows.reduce((sum: number, r: any) => sum + (r.weight || 0) * (r.reps || 0) + (r.drop_volume || 0), 0);
  const spanSecs = durationSecs
    || Math.max(1, Math.round(
        (new Date(rows[rows.length - 1].completed_at).getTime() -
         new Date(rows[0].completed_at).getTime()) / 1000
      ));
  const minutes = spanSecs / 60;

  return {
    totalRestSecs,
    avgRestSecs,
    gapCount,
    setsPerMinute: Math.round((rows.length / minutes) * 10) / 10,
    volumePerMinute: Math.round(totalVolume / minutes),
    hasData: true,
  };
}

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
      COALESCE(SUM(CASE WHEN se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL) THEN se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0) ELSE 0 END),0) as totalVolume
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
           COUNT(CASE WHEN (se.is_warmup = 0 OR se.is_warmup IS NULL) THEN se.id END) as totalSets,
           COALESCE(SUM(CASE WHEN (se.is_warmup = 0 OR se.is_warmup IS NULL) AND se.completed = 1 THEN se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0) ELSE 0 END),0) as totalVolume
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

  // Get all exercises performed in this session (including assisted flag)
  const exercisesRes = await executeSqlAsync(
    `
    SELECT DISTINCT tco.exercise_id, e.name as exercise_name,
           COALESCE(e.is_assisted, 0) as is_assisted
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
    const assisted = ex.is_assisted === 1;

    // ── e1RM PR (skip for assisted exercises — e1RM is meaningless for counterweight) ──
    if (!assisted) {
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
    }

    // ── Weight PR ──
    // Normal: MAX weight = stronger. Assisted: MIN weight = less help = stronger.
    const aggFn = assisted ? 'MIN' : 'MAX';
    const comparator = assisted
      ? (cur: number, prev: number) => cur < prev   // lower assist = PR
      : (cur: number, prev: number) => cur > prev;  // higher weight = PR

    const thisWeight = await executeSqlAsync(
      `
      SELECT ${aggFn}(se.weight) as best
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
      SELECT ${aggFn}(se.weight) as best
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

    const prType = assisted ? 'least_assisted' : 'weight';
    if (currentWeight && (!previousWeight || comparator(currentWeight, previousWeight))) {
      await executeSqlAsync(
        `INSERT INTO personal_records(exercise_id, session_id, pr_type, value, previous_value, created_at)
         VALUES (?,?,?,?,?,?);`,
        [ex.exercise_id, sessionId, prType, currentWeight, previousWeight || null, now]
      );
      prs.push({
        exercise_name: ex.exercise_name,
        pr_type: prType,
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
           COALESCE(SUM(se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0)), 0) as volume
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

/* ═══════════════════════════════════════════════════════════
 *  Workout Review — per-exercise comparison vs last session
 * ═══════════════════════════════════════════════════════════ */

export type ExerciseDelta = {
  exercise_name: string;
  // This session
  top_weight: number;
  total_volume: number;
  total_reps: number;
  completed_sets: number;
  // Last session
  prev_top_weight: number | null;
  prev_total_volume: number | null;
  prev_total_reps: number | null;
  prev_completed_sets: number | null;
  // Computed
  status: 'progressed' | 'regressed' | 'maintained' | 'new' | 'skipped';
};

export type ExercisePerformanceStatus = ExerciseDelta['status'];

export async function latestPerformanceStatusForExercise(
  exerciseId: number,
): Promise<ExercisePerformanceStatus | null> {
  const exerciseRes = await executeSqlAsync(
    `
    SELECT e.name as exercise_name, COALESCE(e.is_assisted, 0) as is_assisted
    FROM exercises e
    WHERE e.id = ?
    LIMIT 1;
    `,
    [exerciseId]
  );
  if (!exerciseRes.rows.length) return null;

  const assisted = !!exerciseRes.rows.item(0).is_assisted;
  const aggFn = assisted ? 'MIN' : 'MAX';

  const latestSessionRes = await executeSqlAsync(
    `
    SELECT s.id
    FROM sessions s
    JOIN session_slots ss ON ss.session_id = s.id
    JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    WHERE s.status = 'final' AND tco.exercise_id = ?
    GROUP BY s.id
    ORDER BY s.performed_at DESC, s.id DESC
    LIMIT 1;
    `,
    [exerciseId]
  );
  if (!latestSessionRes.rows.length) return null;

  const latestSessionId = latestSessionRes.rows.item(0).id;
  const latestStatsRes = await executeSqlAsync(
    `
    SELECT ${aggFn}(se.weight) as top_weight,
           COALESCE(SUM(se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0)), 0) as total_volume,
           COALESCE(SUM(se.reps), 0) as total_reps,
           COUNT(*) as completed_sets
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    WHERE ss.session_id = ? AND tco.exercise_id = ?
      AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
    `,
    [latestSessionId, exerciseId]
  );
  const latest = latestStatsRes.rows.item(0);

  if (!latest.completed_sets || latest.completed_sets === 0) {
    return 'skipped';
  }

  const prevSessionRes = await executeSqlAsync(
    `
    SELECT s.id
    FROM sessions s
    JOIN session_slots ss ON ss.session_id = s.id
    JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN sets se ON se.session_slot_choice_id = ssc.id
                AND se.completed = 1
                AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
    WHERE s.status = 'final' AND s.id != ? AND tco.exercise_id = ?
    GROUP BY s.id
    HAVING COUNT(se.id) > 0
    ORDER BY s.performed_at DESC, s.id DESC
    LIMIT 1;
    `,
    [latestSessionId, exerciseId]
  );

  if (!prevSessionRes.rows.length) {
    return 'new';
  }

  const prevSessionId = prevSessionRes.rows.item(0).id;
  const prevStatsRes = await executeSqlAsync(
    `
    SELECT ${aggFn}(se.weight) as top_weight,
           COALESCE(SUM(se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0)), 0) as total_volume
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    WHERE ss.session_id = ? AND tco.exercise_id = ?
      AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
    `,
    [prevSessionId, exerciseId]
  );
  const prev = prevStatsRes.rows.item(0);

  const volumeDiff = (latest.total_volume || 0) - (prev?.total_volume || 0);
  const weightDiff = (latest.top_weight || 0) - (prev?.top_weight || 0);

  if (assisted) {
    if (weightDiff < 0 || volumeDiff < 0) return 'progressed';
    if (weightDiff > 0 || volumeDiff > 0) return 'regressed';
    return 'maintained';
  }

  if (weightDiff > 0 || volumeDiff > 0) return 'progressed';
  if (weightDiff < 0 || volumeDiff < 0) return 'regressed';
  return 'maintained';
}

/**
 * Compare each exercise in sessionId to the last time it was performed.
 * Returns per-exercise deltas with progression/regression status.
 */
export async function sessionExerciseDeltas(sessionId: number): Promise<ExerciseDelta[]> {
  // Get exercises in this session (including assisted flag)
  const exercisesRes = await executeSqlAsync(
    `
    SELECT DISTINCT tco.exercise_id, e.name as exercise_name,
           COALESCE(e.is_assisted, 0) as is_assisted
    FROM session_slots ss
    JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tco.exercise_id
    WHERE ss.session_id = ?;
    `,
    [sessionId]
  );

  const deltas: ExerciseDelta[] = [];

  for (const ex of exercisesRes.rows._array) {
    const assisted = !!ex.is_assisted;
    // For assisted exercises use MIN (less assistance = stronger); normal uses MAX.
    const aggFn = assisted ? 'MIN' : 'MAX';
    // This session stats
    const thisRes = await executeSqlAsync(
      `
      SELECT ${aggFn}(se.weight) as top_weight,
             COALESCE(SUM(se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0)), 0) as total_volume,
             COALESCE(SUM(se.reps), 0) as total_reps,
             COUNT(*) as completed_sets
      FROM sets se
      JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      JOIN session_slots ss ON ss.id = ssc.session_slot_id
      WHERE ss.session_id = ? AND tco.exercise_id = ?
        AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
      `,
      [sessionId, ex.exercise_id]
    );
    const cur = thisRes.rows.item(0);

    // Skip exercises with no completed working sets — the user didn't
    // actually perform this exercise, so it's not a regression.
    if (!cur.completed_sets || cur.completed_sets === 0) {
      deltas.push({
        exercise_name: ex.exercise_name,
        top_weight: 0,
        total_volume: 0,
        total_reps: 0,
        completed_sets: 0,
        prev_top_weight: null,
        prev_total_volume: null,
        prev_total_reps: null,
        prev_completed_sets: null,
        status: 'skipped',
      });
      continue;
    }

    // Find previous session containing this exercise WITH completed working sets.
    // Skip sessions where the exercise existed but wasn't actually performed.
    const prevSessionRes = await executeSqlAsync(
      `
      SELECT s.id
      FROM sessions s
      JOIN session_slots ss ON ss.session_id = s.id
      JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      JOIN sets se ON se.session_slot_choice_id = ssc.id
                  AND se.completed = 1
                  AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
      WHERE s.status = 'final' AND s.id != ? AND tco.exercise_id = ?
      GROUP BY s.id
      HAVING COUNT(se.id) > 0
      ORDER BY s.performed_at DESC, s.id DESC
      LIMIT 1;
      `,
      [sessionId, ex.exercise_id]
    );

    let prev: any = null;
    if (prevSessionRes.rows.length) {
      const prevId = prevSessionRes.rows.item(0).id;
      const prevRes = await executeSqlAsync(
        `
        SELECT ${aggFn}(se.weight) as top_weight,
               COALESCE(SUM(se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0)), 0) as total_volume,
               COALESCE(SUM(se.reps), 0) as total_reps,
               COUNT(*) as completed_sets
        FROM sets se
        JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
        JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
        JOIN session_slots ss ON ss.id = ssc.session_slot_id
        WHERE ss.session_id = ? AND tco.exercise_id = ?
          AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
        `,
        [prevId, ex.exercise_id]
      );
      prev = prevRes.rows.item(0);
    }

    // Determine status
    let status: ExerciseDelta['status'] = 'new';
    if (prev && prev.top_weight != null) {
      const volumeDiff = cur.total_volume - prev.total_volume;
      const weightDiff = (cur.top_weight || 0) - (prev.top_weight || 0);
      if (assisted) {
        // For assisted: lower weight = less assistance = progress
        if (weightDiff < 0 || volumeDiff < 0) {
          status = 'progressed';
        } else if (weightDiff > 0 || volumeDiff > 0) {
          status = 'regressed';
        } else {
          status = 'maintained';
        }
      } else {
        if (weightDiff > 0 || volumeDiff > 0) {
          status = 'progressed';
        } else if (weightDiff < 0 || volumeDiff < 0) {
          status = 'regressed';
        } else {
          status = 'maintained';
        }
      }
    }

    deltas.push({
      exercise_name: ex.exercise_name,
      top_weight: cur.top_weight || 0,
      total_volume: cur.total_volume || 0,
      total_reps: cur.total_reps || 0,
      completed_sets: cur.completed_sets || 0,
      prev_top_weight: prev?.top_weight ?? null,
      prev_total_volume: prev?.total_volume ?? null,
      prev_total_reps: prev?.total_reps ?? null,
      prev_completed_sets: prev?.completed_sets ?? null,
      status,
    });
  }

  return deltas;
}

/**
 * Get the volume and duration of the last finalized session with the same template.
 * Used for volume/duration comparison on the summary screen.
 */
export async function previousSessionComparison(sessionId: number): Promise<{
  prevVolume: number | null;
  prevDurationSecs: number | null;
} | null> {
  // Get this session's template_id
  const sRes = await executeSqlAsync(
    `SELECT template_id FROM sessions WHERE id = ?;`,
    [sessionId]
  );
  if (!sRes.rows.length) return null;
  const templateId = sRes.rows.item(0).template_id;
  if (!templateId) return null;

  // Find the previous session with the same template
  const prevRes = await executeSqlAsync(
    `
    SELECT id, performed_at, created_at
    FROM sessions
    WHERE status = 'final' AND template_id = ? AND id != ?
    ORDER BY performed_at DESC, id DESC
    LIMIT 1;
    `,
    [templateId, sessionId]
  );
  if (!prevRes.rows.length) return null;
  const prev = prevRes.rows.item(0);

  // Volume
  const volRes = await executeSqlAsync(
    `
    SELECT COALESCE(SUM(se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0)), 0) as vol
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    WHERE ss.session_id = ? AND se.completed = 1
      AND (se.is_warmup = 0 OR se.is_warmup IS NULL);
    `,
    [prev.id]
  );

  // Duration (performed_at - created_at)
  const created = new Date(prev.created_at).getTime();
  const performed = new Date(prev.performed_at).getTime();
  const durationSecs = Math.max(0, Math.floor((performed - created) / 1000));

  return {
    prevVolume: volRes.rows.item(0).vol,
    prevDurationSecs: durationSecs > 0 ? durationSecs : null,
  };
}

/* ═══════════════════════════════════════════════════════════
 *  Weekly Report — data for the shareable PDF summary
 * ═══════════════════════════════════════════════════════════ */

/** One session's summary for the weekly report. */
export type WeeklySessionSummary = {
  id: number;
  performed_at: string;
  template_name: string | null;
  duration_secs: number;
  total_volume: number;
  completed_sets: number;
  exercises: string[];
  prs: number;
};

/** Per-exercise breakdown row within the weekly report. */
export type WeeklyExerciseRow = {
  exercise_name: string;
  primary_muscle: string | null;
  sessions_count: number;
  total_sets: number;
  total_volume: number;
  best_set: string; // e.g. "100 × 8"
};

/** Aggregate weekly report data. */
export type WeeklyReportData = {
  startDate: string;   // inclusive YYYY-MM-DD
  endDate: string;     // inclusive YYYY-MM-DD
  sessions: WeeklySessionSummary[];
  exercises: WeeklyExerciseRow[];
  muscleVolume: MuscleVolumeRow[];
  totalVolume: number;
  totalSets: number;
  totalPrs: number;
  avgDurationMins: number;
};

/**
 * Gather all data needed for the weekly summary PDF.
 * `startDate` / `endDate` are ISO date strings (YYYY-MM-DD), interpreted as local dates.
 */
export async function weeklyReportData(
  startDate: string,
  endDate: string,
): Promise<WeeklyReportData> {
  const start = startDate + 'T00:00:00';
  const end = endDate + 'T23:59:59';

  /* ── Sessions ── */
  const sessRes = await executeSqlAsync(
    `
    SELECT s.id, s.performed_at, s.created_at, t.name AS template_name,
           (SELECT COALESCE(SUM(se.weight * se.reps), 0)
            FROM sets se
            JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
            JOIN session_slots ss ON ss.id = ssc.session_slot_id
            WHERE ss.session_id = s.id AND se.completed = 1
              AND (se.is_warmup = 0 OR se.is_warmup IS NULL)) AS total_volume,
           (SELECT COUNT(*)
            FROM sets se
            JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
            JOIN session_slots ss ON ss.id = ssc.session_slot_id
            WHERE ss.session_id = s.id AND se.completed = 1
              AND (se.is_warmup = 0 OR se.is_warmup IS NULL)) AS completed_sets
    FROM sessions s
    LEFT JOIN templates t ON t.id = s.template_id
    WHERE s.status = 'final' AND s.performed_at BETWEEN ? AND ?
    ORDER BY s.performed_at;
    `,
    [start, end],
  );

  const sessions: WeeklySessionSummary[] = [];
  let totalVolume = 0;
  let totalSets = 0;
  let totalDuration = 0;

  for (const row of sessRes.rows._array) {
    // exercises list
    const exRes = await executeSqlAsync(
      `
      SELECT DISTINCT e.name
      FROM session_slots ss
      JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
        AND ss.selected_session_slot_choice_id = ssc.id
      JOIN template_slot_options tso ON tso.id = ssc.template_slot_option_id
      JOIN exercises e ON e.id = tso.exercise_id
      WHERE ss.session_id = ?
      ORDER BY ss.slot_index;
      `,
      [row.id],
    );
    const exercises = exRes.rows._array.map((r: any) => r.name as string);

    // PRs
    const prRes = await executeSqlAsync(
      `SELECT COUNT(*) AS cnt FROM personal_records WHERE session_id = ?;`,
      [row.id],
    );
    const prs = prRes.rows.item(0).cnt;

    const created = new Date(row.created_at).getTime();
    const performed = new Date(row.performed_at).getTime();
    const durationSecs = Math.max(0, Math.floor((performed - created) / 1000));

    sessions.push({
      id: row.id,
      performed_at: row.performed_at,
      template_name: row.template_name,
      duration_secs: durationSecs,
      total_volume: row.total_volume,
      completed_sets: row.completed_sets,
      exercises,
      prs,
    });

    totalVolume += row.total_volume;
    totalSets += row.completed_sets;
    totalDuration += durationSecs;
  }

  /* ── Per-exercise breakdown ── */
  const exBreakRes = await executeSqlAsync(
    `
    SELECT e.name AS exercise_name, e.primary_muscle,
           COUNT(DISTINCT s.id) AS sessions_count,
           COUNT(se.id) AS total_sets,
           COALESCE(SUM(se.weight * se.reps), 0) AS total_volume,
           MAX(se.weight) AS best_weight,
           (SELECT se2.reps FROM sets se2
            JOIN session_slot_choices ssc2 ON ssc2.id = se2.session_slot_choice_id
            JOIN template_slot_options tso2 ON tso2.id = ssc2.template_slot_option_id
            JOIN session_slots ss2 ON ss2.id = ssc2.session_slot_id
            JOIN sessions s2 ON s2.id = ss2.session_id
            WHERE tso2.exercise_id = e.id AND s2.status = 'final'
              AND s2.performed_at BETWEEN ? AND ?
              AND se2.completed = 1 AND (se2.is_warmup = 0 OR se2.is_warmup IS NULL)
            ORDER BY se2.weight DESC, se2.reps DESC LIMIT 1
           ) AS best_reps
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tso ON tso.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tso.exercise_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.status = 'final' AND s.performed_at BETWEEN ? AND ?
      AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
    GROUP BY e.id
    ORDER BY total_volume DESC;
    `,
    [start, end, start, end],
  );

  const exercises: WeeklyExerciseRow[] = exBreakRes.rows._array.map((r: any) => ({
    exercise_name: r.exercise_name,
    primary_muscle: r.primary_muscle,
    sessions_count: r.sessions_count,
    total_sets: r.total_sets,
    total_volume: r.total_volume,
    best_set: `${r.best_weight ?? 0} × ${r.best_reps ?? 0}`,
  }));

  /* ── Muscle volume ── */
  const musRes = await executeSqlAsync(
    `
    SELECT e.primary_muscle AS muscle,
           COUNT(se.id) AS sets,
           COALESCE(SUM(se.weight * se.reps), 0) AS volume
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tso ON tso.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tso.exercise_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.status = 'final' AND s.performed_at BETWEEN ? AND ?
      AND se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
      AND e.primary_muscle IS NOT NULL
    GROUP BY e.primary_muscle ORDER BY volume DESC;
    `,
    [start, end],
  );

  /* ── PRs total ── */
  const prTotalRes = await executeSqlAsync(
    `
    SELECT COUNT(*) AS cnt FROM personal_records pr
    JOIN sessions s ON s.id = pr.session_id
    WHERE s.status = 'final' AND s.performed_at BETWEEN ? AND ?;
    `,
    [start, end],
  );

  return {
    startDate,
    endDate,
    sessions,
    exercises,
    muscleVolume: musRes.rows._array,
    totalVolume,
    totalSets,
    totalPrs: prTotalRes.rows.item(0).cnt,
    avgDurationMins: sessions.length > 0
      ? Math.round(totalDuration / sessions.length / 60)
      : 0,
  };
}

/* ═══════════════════════════════════════════════════════════
 *  Training Insights — body focus, balance, patterns
 * ═══════════════════════════════════════════════════════════ */

export type MuscleBreakdown = { muscle: string; sets: number; pct: number };

export type TrainingInsights = {
  /** All-time sets per muscle group with percentages */
  muscleBreakdown: MuscleBreakdown[];
  /** Push / Pull / Legs set counts + percentages */
  balance: { push: number; pull: number; legs: number; core: number; total: number };
  /** Top 5 most-trained exercises by session count */
  topExercises: Array<{ name: string; sessionCount: number; totalSets: number }>;
  /** Average sessions per week (all-time) */
  avgSessionsPerWeek: number;
  /** Most common training day (0=Sun..6=Sat), null if no data */
  favoriteDayOfWeek: number | null;
  /** Muscles with zero sets in the last 30 days */
  neglectedMuscles: string[];
  /** Week-over-week volume totals for the last 8 weeks */
  weeklyVolumeTrend: Array<{ week: string; volume: number }>;
};

const PUSH_MUSCLES = new Set(['chest', 'shoulders', 'shoulders front', 'shoulders side', 'triceps']);
const PULL_MUSCLES = new Set(['lats', 'mid back', 'upper back', 'lower back', 'biceps', 'forearms', 'rear delt', 'traps']);
const LEG_MUSCLES  = new Set(['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'tibialis']);
const CORE_MUSCLES = new Set(['core', 'abs', 'obliques']);

export async function trainingInsights(): Promise<TrainingInsights> {
  // 1. All-time muscle distribution
  const muscleRes = await executeSqlAsync(
    `
    SELECT e.primary_muscle AS muscle, COUNT(se.id) AS sets
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tco.exercise_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.status = 'final'
      AND se.completed = 1
      AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
      AND e.primary_muscle IS NOT NULL
    GROUP BY e.primary_muscle
    ORDER BY sets DESC;
    `
  );
  const muscleRows: Array<{ muscle: string; sets: number }> = muscleRes.rows._array;
  const totalMuscleSets = muscleRows.reduce((s, r) => s + r.sets, 0);
  const muscleBreakdown: MuscleBreakdown[] = muscleRows.map(r => ({
    muscle: r.muscle,
    sets: r.sets,
    pct: totalMuscleSets > 0 ? Math.round((r.sets / totalMuscleSets) * 100) : 0,
  }));

  // 2. Push / Pull / Legs balance
  let push = 0, pull = 0, legs = 0, core = 0;
  for (const r of muscleRows) {
    const m = r.muscle.toLowerCase();
    if (PUSH_MUSCLES.has(m)) push += r.sets;
    else if (PULL_MUSCLES.has(m)) pull += r.sets;
    else if (LEG_MUSCLES.has(m)) legs += r.sets;
    else if (CORE_MUSCLES.has(m)) core += r.sets;
  }

  // 3. Top exercises by session count
  const topRes = await executeSqlAsync(
    `
    SELECT e.name, COUNT(DISTINCT s.id) AS session_count, COUNT(se.id) AS total_sets
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tco.exercise_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.status = 'final'
      AND se.completed = 1
      AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
    GROUP BY e.id
    ORDER BY session_count DESC, total_sets DESC
    LIMIT 5;
    `
  );
  const topExercises = topRes.rows._array.map((r: any) => ({
    name: r.name,
    sessionCount: r.session_count,
    totalSets: r.total_sets,
  }));

  // 4. Average sessions per week
  const freqRes = await executeSqlAsync(
    `
    SELECT COUNT(*) AS total,
           MIN(performed_at) AS first_date
    FROM sessions WHERE status = 'final';
    `
  );
  const { total, first_date } = freqRes.rows.item(0);
  let avgSessionsPerWeek = 0;
  if (total > 0 && first_date) {
    const weeks = Math.max(1, (Date.now() - new Date(first_date).getTime()) / (7 * 24 * 60 * 60 * 1000));
    avgSessionsPerWeek = Math.round((total / weeks) * 10) / 10;
  }

  // 5. Most common training day
  const dayRes = await executeSqlAsync(
    `
    SELECT CAST(strftime('%w', performed_at) AS INTEGER) AS dow, COUNT(*) AS cnt
    FROM sessions WHERE status = 'final'
    GROUP BY dow ORDER BY cnt DESC LIMIT 1;
    `
  );
  const favoriteDayOfWeek = dayRes.rows.length > 0 ? dayRes.rows.item(0).dow : null;

  // 6. Neglected muscles (trained at least once ever, but zero sets in last 30 days)
  const recentRes = await executeSqlAsync(
    `
    SELECT DISTINCT e.primary_muscle AS muscle
    FROM sets se
    JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
    JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
    JOIN exercises e ON e.id = tco.exercise_id
    JOIN session_slots ss ON ss.id = ssc.session_slot_id
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.status = 'final'
      AND s.performed_at >= datetime('now', '-30 days')
      AND se.completed = 1
      AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
      AND e.primary_muscle IS NOT NULL;
    `
  );
  const recentMuscles = new Set(recentRes.rows._array.map((r: any) => r.muscle));
  const allTrainedMuscles = muscleRows.map(r => r.muscle);
  const neglectedMuscles = allTrainedMuscles.filter(m => !recentMuscles.has(m));

  // 7. Weekly volume trend (last 8 weeks)
  const volTrendRes = await executeSqlAsync(
    `
    SELECT strftime('%Y-%W', s.performed_at) AS week,
           COALESCE(SUM(
             CASE WHEN se.completed = 1 AND (se.is_warmup = 0 OR se.is_warmup IS NULL)
               THEN se.weight * se.reps + COALESCE((SELECT SUM(ds.weight * ds.reps) FROM drop_set_segments ds WHERE ds.set_id = se.id), 0)
               ELSE 0 END
           ), 0) AS volume
    FROM sessions s
    JOIN session_slots ss ON ss.session_id = s.id
    JOIN session_slot_choices ssc ON ssc.session_slot_id = ss.id
    JOIN sets se ON se.session_slot_choice_id = ssc.id
    WHERE s.status = 'final'
      AND s.performed_at >= datetime('now', '-56 days')
    GROUP BY week
    ORDER BY week;
    `
  );
  const weeklyVolumeTrend = volTrendRes.rows._array.map((r: any) => ({
    week: r.week,
    volume: r.volume,
  }));

  return {
    muscleBreakdown,
    balance: { push, pull, legs, core, total: totalMuscleSets },
    topExercises,
    avgSessionsPerWeek,
    favoriteDayOfWeek,
    neglectedMuscles,
    weeklyVolumeTrend,
  };
}
