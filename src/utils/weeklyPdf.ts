/**
 * weeklyPdf — generates an HTML-based weekly workout summary and exports it
 * via the system print dialog (which allows "Save as PDF" to Files/Downloads).
 */
import * as Print from 'expo-print';
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

/** Return day-of-week index 0=Mon..6=Sun from an ISO datetime string. */
function dayIndex(iso: string): number {
  const d = new Date(iso).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Capitalize first letter of each word. */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildHtml(data: WeeklyReportData, unitLabel: string): string {
  const dateRange = `${shortDay(data.startDate + 'T00:00:00')} – ${shortDay(data.endDate + 'T00:00:00')}`;

  /* ── Workout-day dots ── */
  const activeDays = new Set(data.sessions.map((s) => dayIndex(s.performed_at)));
  const dayDots = DAY_LABELS.map(
    (label, i) =>
      `<div class="day-dot${activeDays.has(i) ? ' active' : ''}">
        <div class="dot"></div>
        <span>${label}</span>
      </div>`,
  ).join('');

  /* ── Muscle volume bars (CSS bar chart) ── */
  const maxMuscleVol = data.muscleVolume.length > 0 ? data.muscleVolume[0].volume : 1;
  const muscleBars = data.muscleVolume
    .map(
      (m) => {
        const pct = Math.max(4, Math.round((m.volume / maxMuscleVol) * 100));
        return `
      <div class="bar-row">
        <span class="bar-label">${titleCase(m.muscle)}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="bar-val">${m.sets}s · ${Math.round(m.volume).toLocaleString()} ${unitLabel}</span>
      </div>`;
      },
    )
    .join('');

  /* ── Session cards ── */
  const sessionCards = data.sessions
    .map(
      (s) => `
    <div class="session-card">
      <div class="session-header">
        <div>
          <span class="session-day">${shortDay(s.performed_at)}</span>
          <span class="session-template">${s.template_name ?? 'Free workout'}</span>
        </div>
        <div class="session-badges">
          ${s.prs > 0 ? `<span class="badge pr-badge">🏆 ${s.prs} PR${s.prs > 1 ? 's' : ''}</span>` : ''}
          <span class="badge">${fmtDuration(s.duration_secs)}</span>
        </div>
      </div>
      <div class="session-stats">
        <span><strong>${s.completed_sets}</strong> sets</span>
        <span class="sep">·</span>
        <span><strong>${Math.round(s.total_volume).toLocaleString()}</strong> ${unitLabel}</span>
      </div>
      <div class="session-exercises">${s.exercises.join(' · ')}</div>
    </div>`,
    )
    .join('\n');

  /* ── Exercise table ── */
  const exerciseRows = data.exercises
    .map(
      (e, i) => `
    <tr>
      <td class="rank">${i + 1}</td>
      <td><strong>${e.exercise_name}</strong><br/><span class="muscle-tag">${titleCase(e.primary_muscle ?? '—')}</span></td>
      <td class="num">${e.total_sets}</td>
      <td class="num">${Math.round(e.total_volume).toLocaleString()}</td>
      <td class="num best-set">${e.best_set}</td>
    </tr>`,
    )
    .join('\n');

  /* ── Top exercise callout ── */
  const topEx = data.exercises.length > 0 ? data.exercises[0] : null;
  const topExHtml = topEx
    ? `<div class="callout">
        <span class="callout-emoji">💪</span>
        <div>
          <strong>Top Exercise:</strong> ${topEx.exercise_name} —
          ${topEx.total_sets} sets, ${Math.round(topEx.total_volume).toLocaleString()} ${unitLabel} total volume
        </div>
      </div>`
    : '';

  /* ── Total time ── */
  const totalTimeSecs = data.sessions.reduce((acc, s) => acc + s.duration_secs, 0);

  const noData = data.sessions.length === 0;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { margin: 16px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11px; color: #1e1e2e; background: #fff;
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: #fff; border-radius: 12px; padding: 20px 24px 16px;
    margin-bottom: 16px;
  }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 2px; }
  .header .sub { opacity: 0.85; font-size: 12px; }

  /* ── Stat pills row ── */
  .pills { display: flex; gap: 10px; margin-bottom: 16px; }
  .pill {
    flex: 1; background: #f8f7ff; border: 1px solid #e8e6f0;
    border-radius: 10px; padding: 12px 8px; text-align: center;
  }
  .pill-icon { font-size: 18px; margin-bottom: 2px; }
  .pill-val { font-size: 20px; font-weight: 800; color: #2d2b42; }
  .pill-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: #8888a0; margin-top: 2px; }

  /* ── Day heatmap ── */
  .day-strip { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
  .day-dot { text-align: center; }
  .day-dot span { display: block; font-size: 9px; color: #aaa; margin-top: 3px; }
  .dot {
    width: 22px; height: 22px; border-radius: 50%;
    background: #eee; margin: 0 auto;
    transition: background 0.3s;
  }
  .day-dot.active .dot { background: #6c5ce7; }
  .day-dot.active span { color: #6c5ce7; font-weight: 700; }

  /* ── Callout ── */
  .callout {
    display: flex; align-items: center; gap: 10px;
    background: #fef9ef; border-left: 4px solid #f0c040;
    border-radius: 0 8px 8px 0; padding: 10px 14px;
    margin-bottom: 14px; font-size: 11px;
  }
  .callout-emoji { font-size: 22px; }

  /* ── Section heading ── */
  .section-title {
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #6c5ce7; margin: 18px 0 8px;
    border-bottom: 2px solid #e8e6f0; padding-bottom: 4px;
  }

  /* ── Session cards ── */
  .session-card {
    border: 1px solid #e8e6f0; border-radius: 10px;
    padding: 10px 14px; margin-bottom: 8px;
    page-break-inside: avoid;
  }
  .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .session-day { font-weight: 700; font-size: 12px; margin-right: 8px; }
  .session-template { color: #6c5ce7; font-weight: 600; font-size: 11px; }
  .session-badges { display: flex; gap: 6px; }
  .badge {
    background: #f0eff8; border-radius: 6px; padding: 2px 8px;
    font-size: 10px; font-weight: 600; color: #555;
  }
  .pr-badge { background: #fff7e0; color: #b8860b; }
  .session-stats { font-size: 11px; color: #555; margin-bottom: 3px; }
  .session-stats strong { color: #2d2b42; }
  .sep { color: #ccc; margin: 0 4px; }
  .session-exercises { font-size: 10px; color: #888; }

  /* ── Muscle bars ── */
  .bar-row { display: flex; align-items: center; margin-bottom: 5px; }
  .bar-label { width: 90px; font-size: 10px; font-weight: 600; color: #444; text-align: right; padding-right: 8px; }
  .bar-track { flex: 1; height: 14px; background: #f0eff8; border-radius: 7px; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #6c5ce7, #a29bfe); border-radius: 7px; }
  .bar-val { width: 120px; font-size: 9px; color: #888; padding-left: 8px; white-space: nowrap; }

  /* ── Exercise table ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th {
    text-align: left; font-size: 9px; text-transform: uppercase;
    letter-spacing: 0.5px; color: #8888a0;
    border-bottom: 2px solid #e8e6f0; padding: 5px 6px;
  }
  td { padding: 6px 6px; border-bottom: 1px solid #f2f2f8; font-size: 11px; vertical-align: top; }
  .num { text-align: right; }
  .rank { color: #bbb; font-weight: 700; width: 20px; }
  .muscle-tag { font-size: 9px; color: #8888a0; }
  .best-set { font-weight: 700; color: #6c5ce7; }
  tr:nth-child(even) td { background: #fafaff; }

  /* ── No-data ── */
  .no-data { text-align: center; color: #aaa; font-size: 14px; padding: 40px 0; }

  /* ── Footer ── */
  .footer {
    margin-top: 20px; text-align: center; font-size: 8px;
    color: #bbb; border-top: 1px solid #eee; padding-top: 8px;
  }
</style>
</head>
<body>

  <!-- ── Header ── -->
  <div class="header">
    <h1>Weekly Summary</h1>
    <div class="sub">${dateRange} · Own You — Workout Tracker</div>
  </div>

  ${noData ? '<div class="no-data">No workouts logged this week. Time to hit the gym! 🏋️</div>' : `

  <!-- ── Stat pills ── -->
  <div class="pills">
    <div class="pill">
      <div class="pill-icon">🏋️</div>
      <div class="pill-val">${data.sessions.length}</div>
      <div class="pill-label">Workouts</div>
    </div>
    <div class="pill">
      <div class="pill-icon">🔁</div>
      <div class="pill-val">${data.totalSets}</div>
      <div class="pill-label">Sets</div>
    </div>
    <div class="pill">
      <div class="pill-icon">📦</div>
      <div class="pill-val">${Math.round(data.totalVolume).toLocaleString()}</div>
      <div class="pill-label">Volume (${unitLabel})</div>
    </div>
    <div class="pill">
      <div class="pill-icon">⏱️</div>
      <div class="pill-val">${fmtDuration(totalTimeSecs)}</div>
      <div class="pill-label">Total Time</div>
    </div>
    <div class="pill">
      <div class="pill-icon">🏆</div>
      <div class="pill-val">${data.totalPrs}</div>
      <div class="pill-label">PRs</div>
    </div>
  </div>

  <!-- ── Day heatmap ── -->
  <div class="day-strip">${dayDots}</div>

  <!-- ── Top exercise callout ── -->
  ${topExHtml}

  <!-- ── Sessions ── -->
  <div class="section-title">Sessions</div>
  ${sessionCards}

  <!-- ── Muscle Volume (bars) ── -->
  ${data.muscleVolume.length > 0 ? `
  <div class="section-title">Muscle Volume</div>
  ${muscleBars}
  ` : ''}

  <!-- ── Exercise breakdown ── -->
  ${data.exercises.length > 0 ? `
  <div class="section-title">Exercise Breakdown</div>
  <table>
    <tr>
      <th>#</th>
      <th>Exercise</th>
      <th class="num">Sets</th>
      <th class="num">Volume (${unitLabel})</th>
      <th class="num">Best Set</th>
    </tr>
    ${exerciseRows}
  </table>
  ` : ''}

  `}

  <div class="footer">
    Generated by Own You · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════
 *  Public API
 * ═══════════════════════════════════════════════════════════ */

/**
 * Generate a weekly summary PDF and open the system print dialog.
 * The print dialog allows the user to "Save as PDF" directly to
 * Files / Downloads without going through a share sheet.
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
  await Print.printAsync({ html });
}
