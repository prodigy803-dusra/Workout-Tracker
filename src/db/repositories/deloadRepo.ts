/**
 * deloadRepo — deload week detection, settings, and session marking.
 *
 * Detection uses a combination of schedule-based and autoregulation signals:
 * - Schedule: weeks since last deload ≥ configured threshold
 * - Regression: ≥50% of exercises regressed in recent sessions
 * - Injury: active moderate/severe injury
 *
 * A suggestion fires when ≥2 signals are present, or the schedule alone
 * if the user is significantly overdue (threshold + 2 weeks).
 */
import { executeSqlAsync } from '../db';
import { sessionExerciseDeltas } from './statsRepo';

/* ── Setting keys ─────────────────────────────────────────── */
const KEY_DELOAD_ENABLED = 'deload_enabled';
const KEY_DELOAD_FREQUENCY = 'deload_frequency_weeks';
const KEY_DELOAD_INTENSITY = 'deload_intensity_pct';
const KEY_DELOAD_DISMISSED = 'deload_dismissed_at';

/* ── Types ────────────────────────────────────────────────── */
export type DeloadSettings = {
  enabled: boolean;
  frequencyWeeks: number;
  intensityPct: number;
};

export type DeloadSignal = {
  schedule: boolean;
  scheduleOverdue: boolean;
  regression: boolean;
  injury: boolean;
  weeksSinceDeload: number;
};

export type DeloadSuggestion = {
  shouldDeload: boolean;
  signals: DeloadSignal;
};

/* ── Settings CRUD ────────────────────────────────────────── */

async function getSetting(key: string, fallback: string): Promise<string> {
  const res = await executeSqlAsync(
    `SELECT value FROM app_settings WHERE key = ?;`,
    [key],
  );
  return res.rows.length ? res.rows.item(0).value : fallback;
}

async function setSetting(key: string, value: string): Promise<void> {
  await executeSqlAsync(
    `INSERT INTO app_settings(key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, value],
  );
}

export async function getDeloadSettings(): Promise<DeloadSettings> {
  const [enabled, freq, intensity] = await Promise.all([
    getSetting(KEY_DELOAD_ENABLED, '1'),
    getSetting(KEY_DELOAD_FREQUENCY, '5'),
    getSetting(KEY_DELOAD_INTENSITY, '60'),
  ]);
  return {
    enabled: enabled === '1',
    frequencyWeeks: Math.max(2, Math.min(12, parseInt(freq, 10) || 5)),
    intensityPct: Math.max(30, Math.min(90, parseInt(intensity, 10) || 60)),
  };
}

export async function setDeloadEnabled(enabled: boolean): Promise<void> {
  await setSetting(KEY_DELOAD_ENABLED, enabled ? '1' : '0');
}

export async function setDeloadFrequency(weeks: number): Promise<void> {
  await setSetting(KEY_DELOAD_FREQUENCY, String(Math.max(2, Math.min(12, weeks))));
}

export async function setDeloadIntensity(pct: number): Promise<void> {
  await setSetting(KEY_DELOAD_INTENSITY, String(Math.max(30, Math.min(90, pct))));
}

/** Record that the user dismissed the deload suggestion (snooze for 1 week). */
export async function dismissDeloadSuggestion(): Promise<void> {
  await setSetting(KEY_DELOAD_DISMISSED, new Date().toISOString());
}

/* ── Session marking ──────────────────────────────────────── */

/** Mark a draft session as a deload session. */
export async function markSessionAsDeload(sessionId: number): Promise<void> {
  await executeSqlAsync(
    `UPDATE sessions SET is_deload = 1 WHERE id = ?;`,
    [sessionId],
  );
}

/** Apply deload weight reduction to all sets in a draft session. */
export async function applyDeloadWeights(sessionId: number, intensityPct: number): Promise<void> {
  const factor = Math.max(0.3, Math.min(0.9, intensityPct / 100));
  // Reduce all non-warmup set weights, rounding to nearest 0.25
  await executeSqlAsync(
    `UPDATE sets SET weight = ROUND(weight * ? * 4) / 4
     WHERE session_slot_choice_id IN (
       SELECT ssc.id FROM session_slot_choices ssc
       JOIN session_slots ss ON ss.id = ssc.session_slot_id
       WHERE ss.session_id = ?
     ) AND (is_warmup = 0 OR is_warmup IS NULL);`,
    [factor, sessionId],
  );
}

/** Check if a session is a deload session. */
export async function isDeloadSession(sessionId: number): Promise<boolean> {
  const res = await executeSqlAsync(
    `SELECT is_deload FROM sessions WHERE id = ?;`,
    [sessionId],
  );
  return res.rows.length > 0 && res.rows.item(0).is_deload === 1;
}

/* ── Detection ────────────────────────────────────────────── */

/** Get ISO date of most recent finalized deload session, or null. */
async function lastDeloadDate(): Promise<string | null> {
  const res = await executeSqlAsync(
    `SELECT performed_at FROM sessions
     WHERE status = 'final' AND is_deload = 1
     ORDER BY performed_at DESC LIMIT 1;`,
  );
  return res.rows.length ? res.rows.item(0).performed_at : null;
}

/** Get ISO date of first-ever finalized session, or null. */
async function firstSessionDate(): Promise<string | null> {
  const res = await executeSqlAsync(
    `SELECT performed_at FROM sessions
     WHERE status = 'final'
     ORDER BY performed_at ASC LIMIT 1;`,
  );
  return res.rows.length ? res.rows.item(0).performed_at : null;
}

/** Count finalized sessions in the last N days. */
async function sessionsInLastNDays(days: number): Promise<number> {
  const res = await executeSqlAsync(
    `SELECT COUNT(*) as c FROM sessions
     WHERE status = 'final'
       AND performed_at >= datetime('now', ? || ' days');`,
    [`-${days}`],
  );
  return res.rows.item(0).c;
}

/**
 * Check for regression across recent sessions.
 * Returns true if ≥50% of exercises regressed in the last 2 finalized sessions.
 */
async function hasRecentRegression(): Promise<boolean> {
  const sessRes = await executeSqlAsync(
    `SELECT id FROM sessions WHERE status = 'final'
     ORDER BY performed_at DESC LIMIT 2;`,
  );
  if (sessRes.rows.length < 2) return false;

  let totalExercises = 0;
  let regressedExercises = 0;

  for (let i = 0; i < sessRes.rows.length; i++) {
    const sid = sessRes.rows.item(i).id;
    const deltas = await sessionExerciseDeltas(sid);
    const comparable = deltas.filter((d) => d.status !== 'new' && d.status !== 'skipped');
    totalExercises += comparable.length;
    regressedExercises += comparable.filter((d) => d.status === 'regressed').length;
  }

  return totalExercises >= 2 && regressedExercises / totalExercises >= 0.5;
}

/** Check for active moderate/severe injuries. */
async function hasSignificantInjury(): Promise<boolean> {
  const res = await executeSqlAsync(
    `SELECT COUNT(*) as c FROM active_injuries
     WHERE resolved_at IS NULL AND severity IN ('moderate', 'severe');`,
  );
  return res.rows.item(0).c > 0;
}

/**
 * Evaluate whether the user should consider a deload.
 *
 * Returns a suggestion object with individual signals and a final recommendation.
 * Does NOT check if deload is enabled — caller should check that.
 */
export async function evaluateDeload(): Promise<DeloadSuggestion> {
  const settings = await getDeloadSettings();

  // If user recently dismissed, don't suggest again for 7 days
  const dismissedAt = await getSetting(KEY_DELOAD_DISMISSED, '');
  if (dismissedAt) {
    const dismissedMs = new Date(dismissedAt).getTime();
    if (Date.now() - dismissedMs < 7 * 24 * 60 * 60 * 1000) {
      return {
        shouldDeload: false,
        signals: { schedule: false, scheduleOverdue: false, regression: false, injury: false, weeksSinceDeload: 0 },
      };
    }
  }

  // Need at least 4 sessions to have meaningful data
  const recentCount = await sessionsInLastNDays(90);
  if (recentCount < 4) {
    return {
      shouldDeload: false,
      signals: { schedule: false, scheduleOverdue: false, regression: false, injury: false, weeksSinceDeload: 0 },
    };
  }

  // Schedule signal
  const lastDeload = await lastDeloadDate();
  const anchor = lastDeload ?? await firstSessionDate();
  let weeksSince = 0;
  if (anchor) {
    const ms = Date.now() - new Date(anchor).getTime();
    weeksSince = Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
  }
  const scheduleDue = weeksSince >= settings.frequencyWeeks;
  const scheduleOverdue = weeksSince >= settings.frequencyWeeks + 2;

  // Autoregulation signals
  const [regression, injury] = await Promise.all([
    hasRecentRegression(),
    hasSignificantInjury(),
  ]);

  // Decision: overdue schedule alone is enough, otherwise need ≥2 signals
  const signalCount = [scheduleDue, regression, injury].filter(Boolean).length;
  const shouldDeload = scheduleOverdue || signalCount >= 2;

  return {
    shouldDeload,
    signals: {
      schedule: scheduleDue,
      scheduleOverdue,
      regression,
      injury,
      weeksSinceDeload: weeksSince,
    },
  };
}
