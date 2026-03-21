/**
 * CalendarHeatmap — month-based calendar view showing workout frequency.
 * Shows the current month by default with arrows to navigate back/forward.
 * Late in the month (day 21+) shows current month; otherwise shows current.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors, ThemeColors } from '../contexts/ThemeContext';

type Props = {
  /** Map of ISO date strings (YYYY-MM-DD) to workout count */
  workoutDays: Record<string, number>;
  /** Current streak in days */
  streak: number;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarHeatmap({ workoutDays, streak }: Props) {
  const c = useColors();
  const today = useMemo(() => new Date(), []);

  // Month offset: 0 = current month, -1 = last month, etc.
  const [monthOffset, setMonthOffset] = useState(0);

  const canGoForward = monthOffset < 0;

  // Find earliest workout date to limit backward navigation
  const earliestDate = useMemo(() => {
    const dates = Object.keys(workoutDays).sort();
    return dates.length > 0 ? new Date(dates[0] + 'T00:00:00') : today;
  }, [workoutDays, today]);

  const canGoBack = useMemo(() => {
    const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const earliestMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    return viewDate > earliestMonth;
  }, [monthOffset, today, earliestDate]);

  const goBack = useCallback(() => { if (canGoBack) setMonthOffset(o => o - 1); }, [canGoBack]);
  const goForward = useCallback(() => { if (canGoForward) setMonthOffset(o => o + 1); }, [canGoForward]);

  // Build calendar grid for the viewed month
  const { days, year, month, monthWorkouts, monthLabel } = useMemo(() => {
    const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const yr = viewDate.getFullYear();
    const mo = viewDate.getMonth();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    // Day of week for the 1st (Monday = 0)
    const firstDow = (new Date(yr, mo, 1).getDay() + 6) % 7;

    const todayStr = today.toISOString().slice(0, 10);
    const grid: Array<{ day: number; date: string; count: number; isToday: boolean } | null> = [];

    // Leading empty cells
    for (let i = 0; i < firstDow; i++) grid.push(null);

    let workoutsThisMonth = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = workoutDays[dateStr] || 0;
      if (count > 0) workoutsThisMonth++;
      grid.push({ day: d, date: dateStr, count, isToday: dateStr === todayStr });
    }

    return {
      days: grid,
      year: yr,
      month: mo,
      monthWorkouts: workoutsThisMonth,
      monthLabel: `${MONTH_NAMES[mo]} ${yr}`,
    };
  }, [monthOffset, today, workoutDays]);

  const totalRows = Math.ceil(days.length / 7);
  const s = makeStyles(c);

  return (
    <View style={s.container}>
      {/* Streak + stats row */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>
            {streak}<Text style={s.statEmoji}> 🔥</Text>
          </Text>
          <Text style={s.statLabel}>Day Streak</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{monthWorkouts}</Text>
          <Text style={s.statLabel}>This Month</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{Object.keys(workoutDays).length}</Text>
          <Text style={s.statLabel}>All Time</Text>
        </View>
      </View>

      {/* Month navigation */}
      <View style={s.monthNav}>
        <Pressable onPress={goBack} hitSlop={12} style={s.navBtn}>
          <Text style={[s.navArrow, !canGoBack && s.navDisabled]}>‹</Text>
        </Pressable>
        <Text style={s.monthTitle}>{monthLabel}</Text>
        <Pressable onPress={goForward} hitSlop={12} style={s.navBtn}>
          <Text style={[s.navArrow, !canGoForward && s.navDisabled]}>›</Text>
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={s.dayHeaderRow}>
        {DAY_HEADERS.map((d) => (
          <Text key={d} style={s.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      {Array.from({ length: totalRows }, (_, row) => (
        <View key={row} style={s.weekRow}>
          {Array.from({ length: 7 }, (_, col) => {
            const idx = row * 7 + col;
            const cell = days[idx] ?? null;
            if (!cell) return <View key={col} style={s.cellEmpty} />;
            const isFuture = cell.date > today.toISOString().slice(0, 10);
            return (
              <View key={col} style={[
                s.cell,
                { backgroundColor: isFuture ? 'transparent' : cellColor(cell.count, c) },
                cell.isToday && s.cellToday,
              ]}>
                <Text style={[
                  s.cellDay,
                  { color: cell.count > 0 ? '#FFF' : (isFuture ? c.textTertiary : c.textSecondary) },
                  cell.isToday && cell.count === 0 && { color: c.accent },
                ]}>
                  {cell.day}
                </Text>
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={s.legend}>
        <Text style={s.legendText}>Less</Text>
        {[0, 1, 2, 3].map((level) => (
          <View key={level} style={[s.legendCell, { backgroundColor: cellColor(level, c) }]} />
        ))}
        <Text style={s.legendText}>More</Text>
      </View>
    </View>
  );
}

function cellColor(count: number, c: ThemeColors): string {
  if (count === 0) return c.isDark ? '#1A1A1A' : '#EBEDF0';
  if (count === 1) return c.isDark ? '#0E4429' : '#9BE9A8';
  if (count === 2) return c.isDark ? '#006D32' : '#40C463';
  return c.isDark ? '#26A641' : '#216E39';
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 14,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 20, fontWeight: '800', color: c.text },
    statEmoji: { fontSize: 16 },
    statLabel: { fontSize: 10, color: c.textSecondary, fontWeight: '600', marginTop: 2 },
    statDivider: { width: 1, height: 28, backgroundColor: c.border },

    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    navArrow: { fontSize: 28, fontWeight: '300', color: c.text, lineHeight: 30 },
    navDisabled: { opacity: 0.2 },
    monthTitle: { fontSize: 16, fontWeight: '700', color: c.text },

    dayHeaderRow: { flexDirection: 'row', marginBottom: 6 },
    dayHeader: {
      flex: 1, textAlign: 'center',
      fontSize: 11, fontWeight: '600', color: c.textTertiary,
    },

    weekRow: { flexDirection: 'row', marginBottom: 4 },
    cell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 2,
    },
    cellEmpty: { flex: 1, marginHorizontal: 2 },
    cellToday: { borderWidth: 2, borderColor: c.accent },
    cellDay: { fontSize: 12, fontWeight: '600' },

    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 8,
    },
    legendCell: { width: 12, height: 12, borderRadius: 3 },
    legendText: { fontSize: 10, color: c.textTertiary },
  });
}
