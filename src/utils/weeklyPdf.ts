/**
 * weeklyPdf — generates an HTML-based weekly workout summary and exports it
 * as a shareable PDF via expo-print + expo-sharing.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  weeklyReportData,
  type WeeklyReportData,
} from '../db/repositories/statsRepo';

/* ═══════════════════════════════════════════════════════════
 *  Date helpers
 * ═══════════════════════════════════════════════════════════ */

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

/** YYYY-MM-DD for a Date. */
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Friendly display: "Mon 9 Jun" */
function shortDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** mm:ss or h:mm:ss */
function fmtDuration(secs: number) {
  if (secs <= 0) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${pad(m)}:${pad(s)}`
    : `${m}:${pad(s)}`;
}

/** Monday of the current week (ISO weeks start on Monday). */
export function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1; // Mon=0
  const mon = new Date(now);
  mon.setDate(now.getDate() - diff);
  mon.setHours(0, 0, 0, 0);
  return toDateStr(mon);
}

/** Sunday of the week that starts with `startDate`. */
export function weekEnd(startDate: string): string {
  const d = new Date(startDate + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return toDateStr(d);
}

/* ═══════════════════════════════════════════════════════════
 *  HTML template
 * ═══════════════════════════════════════════════════════════ */

function buildHtml(data: WeeklyReportData, unitLabel: string): string {
  const title = `Weekly Summary  ·  ${shortDay(data.startDate + 'T00:00:00')} – ${shortDay(data.endDate + 'T00:00:00')}`;

  const sessionRows = data.sessions
    .map(
      (s) => `
    <tr>
      <td>${shortDay(s.performed_at)}</td>
      <td>${s.template_name ?? 'Free workout'}</td>
      <td>${s.exercises.join(', ')}</td>
      <td class="num">${s.completed_sets}</td>
      <td class="num">${Math.round(s.total_volume).toLocaleString()} ${unitLabel}</td>
      <td class="num">${fmtDuration(s.duration_secs)}</td>
      <td class="num">${s.prs > 0 ? '🏆 ' + s.prs : '—'}</td>
    </tr>`,
    )
    .join('\n');

  const exerciseRows = data.exercises
    .map(
      (e) => `
    <tr>
      <td>${e.exercise_name}</td>
      <td>${e.primary_muscle ?? '—'}</td>
      <td class="num">${e.total_sets}</td>
      <td class="num">${Math.round(e.total_volume).toLocaleString()} ${unitLabel}</td>
      <td class="num">${e.best_set} ${unitLabel.replace('kg', '').replace('lb', '')}</td>
    </tr>`,
    )
    .join('\n');

  const muscleRows = data.muscleVolume
    .map(
      (m) => `
    <tr>
      <td>${m.muscle}</td>
      <td class="num">${m.sets}</td>
      <td class="num">${Math.round(m.volume).toLocaleString()} ${unitLabel}</td>
    </tr>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Helvetica Neue', sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 12px; margin-bottom: 16px; }
  .stats-row { display: flex; gap: 16px; margin-bottom: 20px; }
  .stat-card { flex: 1; background: #f5f5f5; border-radius: 8px; padding: 10px 12px; text-align: center; }
  .stat-val { font-size: 22px; font-weight: 700; color: #333; }
  .stat-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; color: #888; border-bottom: 2px solid #ddd; padding: 4px 6px; }
  td { padding: 5px 6px; border-bottom: 1px solid #eee; font-size: 11px; }
  .num { text-align: right; }
  tr:nth-child(even) { background: #fafafa; }
  .footer { margin-top: 20px; font-size: 9px; color: #aaa; text-align: center; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">Own You — Workout Tracker</p>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-val">${data.sessions.length}</div>
      <div class="stat-label">Workouts</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${data.totalSets}</div>
      <div class="stat-label">Sets</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${Math.round(data.totalVolume).toLocaleString()}</div>
      <div class="stat-label">Volume (${unitLabel})</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${data.avgDurationMins}m</div>
      <div class="stat-label">Avg Duration</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${data.totalPrs}</div>
      <div class="stat-label">PRs</div>
    </div>
  </div>

  ${data.sessions.length === 0 ? '<p style="color:#888;text-align:center;margin:32px 0;">No workouts this week.</p>' : `
  <h2>Sessions</h2>
  <table>
    <tr><th>Day</th><th>Template</th><th>Exercises</th><th class="num">Sets</th><th class="num">Volume</th><th class="num">Time</th><th class="num">PRs</th></tr>
    ${sessionRows}
  </table>

  <h2>Exercise Breakdown</h2>
  <table>
    <tr><th>Exercise</th><th>Muscle</th><th class="num">Sets</th><th class="num">Volume</th><th class="num">Best Set</th></tr>
    ${exerciseRows}
  </table>

  <h2>Muscle Volume</h2>
  <table>
    <tr><th>Muscle</th><th class="num">Sets</th><th class="num">Volume</th></tr>
    ${muscleRows}
  </table>
  `}

  <div class="footer">Generated by Own You on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════
 *  Public API
 * ═══════════════════════════════════════════════════════════ */

/**
 * Generate a weekly summary PDF for the given week and open the share sheet.
 * @param startDate YYYY-MM-DD (Monday)
 * @param endDate   YYYY-MM-DD (Sunday)
 * @param unit      'kg' | 'lb'
 */
export async function shareWeeklySummary(
  startDate: string,
  endDate: string,
  unit: string,
): Promise<void> {
  const data = await weeklyReportData(startDate, endDate);
  const html = buildHtml(data, unit);
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Weekly Summary ${startDate} – ${endDate}`,
    UTI: 'com.adobe.pdf',
  });
}
