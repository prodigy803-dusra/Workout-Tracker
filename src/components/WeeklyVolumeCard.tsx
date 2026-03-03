/**
 * WeeklyVolumeCard — shows muscle group volume for the last 7 days.
 *
 * A horizontal bar per muscle group, coloured by % of recommended sets target.
 * Green = 10+ sets (good), Yellow = 5-9, Red/dim = <5.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, ThemeColors } from '../contexts/ThemeContext';
import type { MuscleVolumeRow } from '../types';

type Props = {
  data: MuscleVolumeRow[];
};

const TARGET_SETS = 10; // recommended weekly working sets per muscle

const DISPLAY: Record<string, string> = {
  chest: 'Chest',
  shoulders_front: 'Front Delt',
  shoulders_side: 'Side Delt',
  biceps: 'Biceps',
  core: 'Core',
  quads: 'Quads',
  tibialis: 'Tibialis',
  traps: 'Traps',
  rear_delt: 'Rear Delt',
  lats: 'Lats',
  mid_back: 'Mid Back',
  lower_back: 'Lower Back',
  triceps: 'Triceps',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

function barColor(sets: number): string {
  if (sets >= TARGET_SETS) return '#2DA44E';   // green — target hit
  if (sets >= 5) return '#D29922';             // yellow — getting there
  return '#CF222E';                            // red — under-trained
}

export default function WeeklyVolumeCard({ data }: Props) {
  const c = useColors();
  const s = makeStyles(c);

  if (!data || data.length === 0) return null;

  // Sort by sets descending
  const sorted = [...data].sort((a, b) => b.sets - a.sets);
  const maxSets = Math.max(...sorted.map((d) => d.sets), TARGET_SETS);

  return (
    <View style={s.card}>
      <Text style={s.title}>WEEKLY MUSCLE VOLUME</Text>
      <Text style={s.subtitle}>Working sets per group · last 7 days</Text>
      {sorted.map((row) => {
        const pct = Math.min(row.sets / maxSets, 1);
        return (
          <View key={row.muscle} style={s.row}>
            <Text style={s.label} numberOfLines={1}>
              {DISPLAY[row.muscle] ?? row.muscle}
            </Text>
            <View style={s.barTrack}>
              <View
                style={[
                  s.barFill,
                  { width: `${Math.max(pct * 100, 4)}%`, backgroundColor: barColor(row.sets) },
                ]}
              />
            </View>
            <Text style={[s.count, { color: barColor(row.sets) }]}>{row.sets}</Text>
          </View>
        );
      })}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#2DA44E' }]} />
          <Text style={s.legendText}>10+ sets</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#D29922' }]} />
          <Text style={s.legendText}>5–9</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: '#CF222E' }]} />
          <Text style={s.legendText}>&lt; 5</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 11,
      color: c.textTertiary ?? c.textSecondary,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    label: {
      width: 80,
      fontSize: 12,
      fontWeight: '600',
      color: c.text,
    },
    barTrack: {
      flex: 1,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.background,
      overflow: 'hidden',
      marginHorizontal: 8,
    },
    barFill: {
      height: '100%',
      borderRadius: 5,
    },
    count: {
      width: 28,
      fontSize: 12,
      fontWeight: '800',
      textAlign: 'right',
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: c.textSecondary },
  });
}
