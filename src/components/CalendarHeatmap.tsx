/**
 * CalendarHeatmap — GitHub-style heatmap showing workout frequency.
 * Displays the last 16 weeks in a grid, with streak counter.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, ThemeColors } from '../contexts/ThemeContext';

type Props = {
  /** Map of ISO date strings (YYYY-MM-DD) to workout count */
  workoutDays: Record<string, number>;
  /** Current streak in days */
  streak: number;
};

const WEEKS = 16;
const DAYS_OF_WEEK = ['M', '', 'W', '', 'F', '', 'S'];

export default function CalendarHeatmap({ workoutDays, streak }: Props) {
  const c = useColors();

  const { grid, months } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
    const totalDays = WEEKS * 7;

    // Start date = today - totalDays + (6 - dayOfWeek) to fill the current week
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + (6 - dayOfWeek));

    const weeks: { date: string; count: number; isToday: boolean }[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];

    let lastMonth = -1;
    const todayStr = today.toISOString().slice(0, 10);

    for (let w = 0; w < WEEKS; w++) {
      const week: typeof weeks[0] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        const dateStr = date.toISOString().slice(0, 10);
        const count = workoutDays[dateStr] || 0;
        const isToday = dateStr === todayStr;
        week.push({ date: dateStr, count, isToday });

        // Track month labels
        const m = date.getMonth();
        if (m !== lastMonth && d === 0) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          monthLabels.push({ label: monthNames[m], weekIndex: w });
          lastMonth = m;
        }
      }
      weeks.push(week);
    }

    return { grid: weeks, months: monthLabels };
  }, [workoutDays]);

  const totalWorkouts = Object.values(workoutDays).reduce((a, b) => a + b, 0);
  const s = makeStyles(c);

  return (
    <View style={s.container}>
      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>
            {streak}
            <Text style={s.statEmoji}> 🔥</Text>
          </Text>
          <Text style={s.statLabel}>Day Streak</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{totalWorkouts}</Text>
          <Text style={s.statLabel}>Workouts</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{Object.keys(workoutDays).length}</Text>
          <Text style={s.statLabel}>Active Days</Text>
        </View>
      </View>

      {/* Month labels */}
      <View style={s.monthRow}>
        <View style={{ width: 16 }} />
        {months.map((m, i) => (
          <Text
            key={i}
            style={[s.monthLabel, { left: 16 + m.weekIndex * 18 }]}
          >
            {m.label}
          </Text>
        ))}
      </View>

      {/* Heatmap grid */}
      <View style={s.gridContainer}>
        {/* Day labels */}
        <View style={s.dayLabels}>
          {DAYS_OF_WEEK.map((d, i) => (
            <Text key={i} style={s.dayLabel}>{d}</Text>
          ))}
        </View>

        {/* Weeks */}
        <View style={s.grid}>
          {grid.map((week, wi) => (
            <View key={wi} style={s.weekColumn}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={[
                    s.cell,
                    { backgroundColor: cellColor(day.count, c) },
                    day.isToday && s.cellToday,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        <Text style={s.legendText}>Less</Text>
        {[0, 1, 2, 3].map((level) => (
          <View
            key={level}
            style={[s.legendCell, { backgroundColor: cellColor(level, c) }]}
          />
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
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginBottom: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
    },
    statEmoji: {
      fontSize: 18,
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: c.border,
    },
    monthRow: {
      position: 'relative',
      height: 18,
      marginBottom: 4,
    },
    monthLabel: {
      position: 'absolute',
      fontSize: 10,
      color: c.textSecondary,
      fontWeight: '600',
    },
    gridContainer: {
      flexDirection: 'row',
      gap: 4,
    },
    dayLabels: {
      gap: 4,
      width: 12,
    },
    dayLabel: {
      fontSize: 9,
      color: c.textTertiary,
      height: 14,
      lineHeight: 14,
      textAlign: 'center',
    },
    grid: {
      flexDirection: 'row',
      gap: 4,
    },
    weekColumn: {
      gap: 4,
    },
    cell: {
      width: 14,
      height: 14,
      borderRadius: 3,
    },
    cellToday: {
      borderWidth: 1.5,
      borderColor: c.accent,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      marginTop: 10,
    },
    legendCell: {
      width: 12,
      height: 12,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 10,
      color: c.textTertiary,
    },
  });
}
