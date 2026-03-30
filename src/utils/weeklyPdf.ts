/**
 * reportPdf — generates HTML-based workout summaries (weekly or overall)
 * and exports via the system print dialog ("Save as PDF").
 */
import * as Print from 'expo-print';
import {
  weeklyReportData,
  overallReportData,
  type WeeklyReportData,
  type OverallReportData,
  type SessionExerciseDetail,
} from '../db/repositories/statsRepo';

/* ═══════════════════════════════════════════════════════════
 *  Date helpers
 * ═══════════════════════════════════════════════════════════ */

/** Escape user-entered text for safe insertion into HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
 *  Shared CSS
 * ═══════════════════════════════════════════════════════════ */

/** Return day-of-week index 0=Mon..6=Sun from an ISO datetime string. */
function dayIndex(iso: string): number {
  const d = new Date(iso).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const SHARED_CSS = `
  @page { margin: 16px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11px; color: #1e1e2e; background: #fff;
  }
  .header {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: #fff; border-radius: 12px; padding: 20px 24px 16px;
    margin-bottom: 16px;
  }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 2px; }
  .header .sub { opacity: 0.85; font-size: 12px; }
  .pills { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .pill {
    flex: 1; min-width: 70px; background: #f8f7ff; border: 1px solid #e8e6f0;
    border-radius: 10px; padding: 10px 6px; text-align: center;
  }
  .pill-icon { font-size: 16px; margin-bottom: 2px; }
  .pill-val { font-size: 18px; font-weight: 800; color: #2d2b42; }
  .pill-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #8888a0; margin-top: 2px; }
  .section-title {
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #6c5ce7; margin: 16px 0 8px;
    border-bottom: 2px solid #e8e6f0; padding-bottom: 4px;
  }
  .callout {
    display: flex; align-items: center; gap: 10px;
    background: #fef9ef; border-left: 4px solid #f0c040;
    border-radius: 0 8px 8px 0; padding: 10px 14px;
    margin-bottom: 14px; font-size: 11px;
  }
  .callout-emoji { font-size: 22px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th {
    text-align: left; font-size: 9px; text-transform: uppercase;
    letter-spacing: 0.5px; color: #8888a0;
    border-bottom: 2px solid #e8e6f0; padding: 5px 6px;
  }
  td { padding: 5px 6px; border-bottom: 1px solid #f2f2f8; font-size: 11px; vertical-align: top; }
  .num { text-align: right; }
  .rank { color: #bbb; font-weight: 700; width: 20px; }
  .muscle-tag { font-size: 9px; color: #8888a0; }
  .best-set { font-weight: 700; color: #6c5ce7; }
  tr:nth-child(even) td { background: #fafaff; }
  .bar-row { display: flex; align-items: center; margin-bottom: 5px; }
  .bar-label { width: 90px; font-size: 10px; font-weight: 600; color: #444; text-align: right; padding-right: 8px; }
  .bar-track { flex: 1; height: 14px; background: #f0eff8; border-radius: 7px; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #6c5ce7, #a29bfe); border-radius: 7px; }
  .bar-val { width: 120px; font-size: 9px; color: #888; padding-left: 8px; white-space: nowrap; }
  .day-strip { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
  .day-dot { text-align: center; }
  .day-dot span { display: block; font-size: 9px; color: #aaa; margin-top: 3px; }
  .dot { width: 22px; height: 22px; border-radius: 50%; background: #eee; margin: 0 auto; }
  .day-dot.active .dot { background: #6c5ce7; }
  .day-dot.active span { color: #6c5ce7; font-weight: 700; }
  .session-card {
    border: 1px solid #e8e6f0; border-radius: 10px;
    padding: 10px 14px; margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .session-day { font-weight: 700; font-size: 12px; margin-right: 8px; }
  .session-template { color: #6c5ce7; font-weight: 600; font-size: 11px; }
  .session-badges { display: flex; gap: 6px; }
  .badge {
    background: #f0eff8; border-radius: 6px; padding: 2px 8px;
    font-size: 10px; font-weight: 600; color: #555;
  }
  .pr-badge { background: #fff7e0; color: #b8860b; }
  .session-stats { font-size: 11px; color: #555; margin-bottom: 4px; }
  .session-stats strong { color: #2d2b42; }
  .sep { color: #ccc; margin: 0 4px; }
  .no-data { text-align: center; color: #aaa; font-size: 14px; padding: 40px 0; }
  .footer {
    margin-top: 20px; text-align: center; font-size: 8px;
    color: #bbb; border-top: 1px solid #eee; padding-top: 8px;
  }
  /* ── Exercise detail rows inside session cards ── */
  .ex-detail { margin-top: 6px; }
  .ex-detail-row {
    display: flex; align-items: baseline; padding: 3px 0;
    border-bottom: 1px solid #f5f5fa;
  }
  .ex-detail-row:last-child { border-bottom: none; }
  .ex-detail-name {
    font-weight: 600; font-size: 11px; color: #2d2b42;
    min-width: 140px; flex-shrink: 0;
  }
  .ex-detail-muscle { font-size: 9px; color: #8888a0; font-weight: 400; margin-left: 4px; }
  .ex-detail-sets { font-size: 10px; color: #555; flex: 1; }
  .set-chip {
    display: inline-block; background: #f0eff8; border-radius: 4px;
    padding: 1px 5px; margin: 1px 3px 1px 0; font-size: 10px;
    color: #444; white-space: nowrap;
  }
  .session-notes {
    margin-top: 6px; padding: 6px 10px; background: #fffde7;
    border-left: 3px solid #f0c040; border-radius: 0 4px 4px 0;
    font-size: 10px; color: #666; font-style: italic;
  }
  /* ── Balance bar ── */
  .balance-bar { display: flex; height: 18px; border-radius: 9px; overflow: hidden; margin: 6px 0 10px; }
  .balance-seg { display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; }
  .balance-legend { display: flex; gap: 14px; font-size: 10px; color: #555; margin-bottom: 12px; }
  .balance-legend span { display: flex; align-items: center; gap: 4px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  /* ── Volume trend mini-bars ── */
  .vol-trend { display: flex; align-items: flex-end; gap: 4px; height: 60px; margin: 8px 0 12px; }
  .vol-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; }
  .vol-bar { width: 100%; background: linear-gradient(180deg, #6c5ce7, #a29bfe); border-radius: 4px 4px 0 0; min-height: 2px; }
  .vol-bar-label { font-size: 7px; color: #aaa; margin-top: 2px; }
`;

/* ═══════════════════════════════════════════════════════════
 *  Weekly HTML
 * ═══════════════════════════════════════════════════════════ */

function renderExerciseDetail(details: SessionExerciseDetail[]): string {
  if (details.length === 0) return '';
  return `<div class="ex-detail">${details.map((ex) => {
    const chips = ex.sets.map((s) => {
      const rpe = s.rpe ? ` @${s.rpe}` : '';
      return `<span class="set-chip">${s.weight}×${s.reps}${rpe}</span>`;
    }).join('');
    const muscle = ex.primary_muscle ? `<span class="ex-detail-muscle">${esc(titleCase(ex.primary_muscle))}</span>` : '';
    return `<div class="ex-detail-row">
      <span class="ex-detail-name">${esc(ex.exercise_name)}${muscle}</span>
      <span class="ex-detail-sets">${chips}</span>
    </div>`;
  }).join('')}</div>`;
}

function buildWeeklyHtml(data: WeeklyReportData, unitLabel: string): string {
  const dateRange = `${shortDay(data.startDate + 'T00:00:00')} – ${shortDay(data.endDate + 'T00:00:00')}`;

  const activeDays = new Set(data.sessions.map((s) => dayIndex(s.performed_at)));
  const dayDots = DAY_LABELS.map(
    (label, i) =>
      `<div class="day-dot${activeDays.has(i) ? ' active' : ''}"><div class="dot"></div><span>${label}</span></div>`,
  ).join('');

  const maxMuscleVol = data.muscleVolume.length > 0 ? data.muscleVolume[0].volume : 1;
  const muscleBars = data.muscleVolume.map((m) => {
    const pct = Math.max(4, Math.round((m.volume / maxMuscleVol) * 100));
    return `<div class="bar-row">
      <span class="bar-label">${titleCase(m.muscle)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <span class="bar-val">${m.sets}s · ${Math.round(m.volume).toLocaleString()} ${unitLabel}</span>
    </div>`;
  }).join('');

  const sessionCards = data.sessions.map((s) => `
    <div class="session-card">
      <div class="session-header">
        <div>
          <span class="session-day">${shortDay(s.performed_at)}</span>
          <span class="session-template">${esc(s.template_name ?? 'Free workout')}</span>
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
      ${renderExerciseDetail(s.exerciseDetails)}
      ${s.notes ? `<div class="session-notes">📝 ${esc(s.notes)}</div>` : ''}
    </div>`).join('\n');

  const exerciseRows = data.exercises.map((e, i) => `
    <tr>
      <td class="rank">${i + 1}</td>
      <td><strong>${esc(e.exercise_name)}</strong><br/><span class="muscle-tag">${esc(titleCase(e.primary_muscle ?? '—'))}</span></td>
      <td class="num">${e.total_sets}</td>
      <td class="num">${Math.round(e.total_volume).toLocaleString()}</td>
      <td class="num best-set">${e.best_set}</td>
    </tr>`).join('\n');

  const totalTimeSecs = data.sessions.reduce((acc, s) => acc + s.duration_secs, 0);
  const noData = data.sessions.length === 0;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${SHARED_CSS}</style></head><body>
  <div class="header">
    <h1>📋 Weekly Training Report</h1>
    <div class="sub">${dateRange} · Own You — Workout Tracker</div>
  </div>
  ${noData ? '<div class="no-data">No workouts logged this week. 🏋️</div>' : `
  <div class="pills">
    <div class="pill"><div class="pill-icon">🏋️</div><div class="pill-val">${data.sessions.length}</div><div class="pill-label">Workouts</div></div>
    <div class="pill"><div class="pill-icon">🔁</div><div class="pill-val">${data.totalSets}</div><div class="pill-label">Sets</div></div>
    <div class="pill"><div class="pill-icon">📦</div><div class="pill-val">${Math.round(data.totalVolume).toLocaleString()}</div><div class="pill-label">Volume (${unitLabel})</div></div>
    <div class="pill"><div class="pill-icon">⏱️</div><div class="pill-val">${fmtDuration(totalTimeSecs)}</div><div class="pill-label">Total Time</div></div>
    <div class="pill"><div class="pill-icon">🏆</div><div class="pill-val">${data.totalPrs}</div><div class="pill-label">PRs</div></div>
  </div>
  <div class="day-strip">${dayDots}</div>

  <div class="section-title">Session Details</div>
  ${sessionCards}

  ${data.muscleVolume.length > 0 ? `<div class="section-title">Muscle Volume</div>${muscleBars}` : ''}

  ${data.exercises.length > 0 ? `
  <div class="section-title">Exercise Summary</div>
  <table>
    <tr><th>#</th><th>Exercise</th><th class="num">Sets</th><th class="num">Volume (${unitLabel})</th><th class="num">Best Set</th></tr>
    ${exerciseRows}
  </table>` : ''}
  `}
  <div class="footer">Generated by Own You · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════
 *  Overall HTML
 * ═══════════════════════════════════════════════════════════ */

function buildOverallHtml(data: OverallReportData, unitLabel: string): string {
  const period = data.firstSessionDate && data.lastSessionDate
    ? `${shortDay(data.firstSessionDate + 'T00:00:00')} – ${shortDay(data.lastSessionDate + 'T00:00:00')}`
    : 'No sessions yet';

  const fmtVol = (v: number) => Math.round(v).toLocaleString();

  /* ── Balance bar ── */
  const bal = data.balance;
  const balTotal = bal.total || 1;
  const balBar = bal.total > 0 ? `
    <div class="balance-bar">
      <div class="balance-seg" style="flex:${bal.push};background:#6c5ce7">${Math.round(bal.push / balTotal * 100)}%</div>
      <div class="balance-seg" style="flex:${bal.pull};background:#00b894">${Math.round(bal.pull / balTotal * 100)}%</div>
      <div class="balance-seg" style="flex:${bal.legs};background:#e17055">${Math.round(bal.legs / balTotal * 100)}%</div>
      ${bal.core > 0 ? `<div class="balance-seg" style="flex:${bal.core};background:#fdcb6e">${Math.round(bal.core / balTotal * 100)}%</div>` : ''}
    </div>
    <div class="balance-legend">
      <span><span class="legend-dot" style="background:#6c5ce7"></span> Push ${bal.push}s</span>
      <span><span class="legend-dot" style="background:#00b894"></span> Pull ${bal.pull}s</span>
      <span><span class="legend-dot" style="background:#e17055"></span> Legs ${bal.legs}s</span>
      ${bal.core > 0 ? `<span><span class="legend-dot" style="background:#fdcb6e"></span> Core ${bal.core}s</span>` : ''}
    </div>` : '';

  /* ── Volume trend bars ── */
  const maxVol = data.weeklyVolumeTrend.length > 0
    ? Math.max(...data.weeklyVolumeTrend.map((w) => w.volume), 1) : 1;
  const volBars = data.weeklyVolumeTrend.length > 0 ? `
    <div class="section-title">Volume Trend (Last 8 Weeks)</div>
    <div class="vol-trend">
      ${data.weeklyVolumeTrend.map((w) => {
        const pct = Math.max(3, Math.round((w.volume / maxVol) * 100));
        const label = w.week.slice(5); // MM-DD
        return `<div class="vol-bar-wrap"><div class="vol-bar" style="height:${pct}%"></div><div class="vol-bar-label">${label}</div></div>`;
      }).join('')}
    </div>` : '';

  /* ── Muscle breakdown bars ── */
  const maxMusPct = data.muscleBreakdown.length > 0 ? data.muscleBreakdown[0].pct : 1;
  const muscleBars = data.muscleBreakdown.map((m) => {
    const pct = Math.max(4, Math.round((m.pct / maxMusPct) * 100));
    return `<div class="bar-row">
      <span class="bar-label">${titleCase(m.muscle)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <span class="bar-val">${m.sets} sets · ${m.pct}%</span>
    </div>`;
  }).join('');

  /* ── Top exercises table ── */
  const topExRows = data.topExercises.map((e, i) => `
    <tr>
      <td class="rank">${i + 1}</td>
      <td><strong>${esc(e.name)}</strong></td>
      <td class="num">${e.sessionCount}</td>
      <td class="num">${e.totalSets}</td>
      <td class="num">${fmtVol(e.totalVolume)}</td>
    </tr>`).join('');

  /* ── PR table ── */
  const prRows = data.topPRs.map((p, i) => `
    <tr>
      <td class="rank">${i + 1}</td>
      <td><strong>${esc(p.exercise_name)}</strong></td>
      <td class="num best-set">${p.e1rm ?? '—'}</td>
      <td class="num">${p.best_weight ?? '—'} × ${p.best_reps ?? '—'}</td>
    </tr>`).join('');

  /* ── Body weight ── */
  const bwSection = data.bodyWeightTrend.length >= 2 ? (() => {
    const first = data.bodyWeightTrend[0].value;
    const last = data.bodyWeightTrend[data.bodyWeightTrend.length - 1].value;
    const diff = last - first;
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
    const color = diff > 0 ? '#e17055' : diff < 0 ? '#00b894' : '#888';
    return `
    <div class="section-title">Body Weight</div>
    <div class="callout">
      <span class="callout-emoji">⚖️</span>
      <div>
        <strong>Current:</strong> ${last} ${unitLabel === 'lb' ? 'lb' : 'kg'}
        <span style="color:${color};font-weight:700;margin-left:8px">${arrow} ${Math.abs(Math.round(diff * 10) / 10)}</span>
        <span style="color:#888;margin-left:4px">from ${first}</span>
      </div>
    </div>`;
  })() : '';

  const noData = data.totalSessions === 0;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${SHARED_CSS}</style></head><body>
  <div class="header">
    <h1>📊 Overall Training Report</h1>
    <div class="sub">${period} · Own You — Workout Tracker</div>
  </div>
  ${noData ? '<div class="no-data">No workouts logged yet. 🏋️</div>' : `
  <div class="pills">
    <div class="pill"><div class="pill-icon">🏋️</div><div class="pill-val">${data.totalSessions}</div><div class="pill-label">Total Sessions</div></div>
    <div class="pill"><div class="pill-icon">📦</div><div class="pill-val">${fmtVol(data.totalVolume)}</div><div class="pill-label">Volume (${unitLabel})</div></div>
    <div class="pill"><div class="pill-icon">🔁</div><div class="pill-val">${data.totalSets}</div><div class="pill-label">Total Sets</div></div>
    <div class="pill"><div class="pill-icon">⏱️</div><div class="pill-val">${fmtDuration(data.totalTimeSecs)}</div><div class="pill-label">Total Time</div></div>
    <div class="pill"><div class="pill-icon">🏆</div><div class="pill-val">${data.totalPrs}</div><div class="pill-label">PRs</div></div>
    <div class="pill"><div class="pill-icon">📅</div><div class="pill-val">${data.avgSessionsPerWeek}</div><div class="pill-label">Avg / Week</div></div>
  </div>

  ${bwSection}

  <div class="section-title">Push / Pull / Legs Balance</div>
  ${balBar}

  ${volBars}

  ${data.muscleBreakdown.length > 0 ? `<div class="section-title">Muscle Group Breakdown</div>${muscleBars}` : ''}

  ${data.topExercises.length > 0 ? `
  <div class="section-title">Top Exercises (by Volume)</div>
  <table>
    <tr><th>#</th><th>Exercise</th><th class="num">Sessions</th><th class="num">Sets</th><th class="num">Volume (${unitLabel})</th></tr>
    ${topExRows}
  </table>` : ''}

  ${data.topPRs.length > 0 ? `
  <div class="section-title">Personal Records (est. 1RM)</div>
  <table>
    <tr><th>#</th><th>Exercise</th><th class="num">e1RM (${unitLabel})</th><th class="num">Best Set</th></tr>
    ${prRows}
  </table>` : ''}
  `}
  <div class="footer">Generated by Own You · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body></html>`;
}

/* ═══════════════════════════════════════════════════════════
 *  Public API
 * ═══════════════════════════════════════════════════════════ */

export async function shareWeeklySummary(
  startDate: string,
  endDate: string,
  unit: string,
): Promise<void> {
  const data = await weeklyReportData(startDate, endDate);
  const html = buildWeeklyHtml(data, unit);
  await Print.printAsync({ html });
}

export async function shareOverallSummary(unit: string): Promise<void> {
  const data = await overallReportData();
  const html = buildOverallHtml(data, unit);
  await Print.printAsync({ html });
}
