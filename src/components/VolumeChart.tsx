/**
 * VolumeChart — horizontal bar chart showing weekly training volume
 * broken down by muscle group. Built with react-native-svg.
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useColors, ThemeColors } from '../contexts/ThemeContext';

export type MuscleVolume = {
  muscle: string;
  sets: number;
  volume: number;
};

type Props = {
  data: MuscleVolume[];
  unit: string;
};

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#E8443A',
  lats: '#4A90D9',
  'mid back': '#4A90D9',
  'lower back': '#4A90D9',
  shoulders: '#F5A623',
  'shoulders front': '#F5A623',
  'shoulders side': '#F5A623',
  'shoulders rear': '#F5A623',
  quads: '#2EA043',
  hamstrings: '#2EA043',
  glutes: '#6C5CE7',
  calves: '#00B894',
  biceps: '#E17055',
  triceps: '#E17055',
  core: '#FDCB6E',
  traps: '#636E72',
  conditioning: '#636E72',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  lats: 'Back (Lats)',
  'mid back': 'Mid Back',
  'lower back': 'Lower Back',
  'shoulders front': 'Front Delts',
  'shoulders side': 'Side Delts',
  'shoulders rear': 'Rear Delts',
  'rear delt': 'Rear Delts',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  traps: 'Traps',
  conditioning: 'Conditioning',
  tibialis: 'Tibialis',
};

export default function VolumeChart({ data, unit }: Props) {
  const c = useColors();

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.sets - a.sets),
    [data]
  );

  const maxSets = useMemo(
    () => Math.max(...sorted.map((d) => d.sets), 1),
    [sorted]
  );

  const s = makeStyles(c);

  if (data.length === 0) {
    return (
      <View style={s.emptyContainer}>
        <Text style={s.emptyText}>No data for this week yet</Text>
      </View>
    );
  }

  const BAR_WIDTH = 220;
  const ROW_HEIGHT = 28;
  const svgHeight = sorted.length * ROW_HEIGHT + 8;

  return (
    <View style={s.container}>
      <Svg width="100%" height={svgHeight} viewBox={`0 0 330 ${svgHeight}`}>
        {sorted.map((item, i) => {
          const y = i * ROW_HEIGHT + 4;
          const barW = (item.sets / maxSets) * BAR_WIDTH;
          const color = MUSCLE_COLORS[item.muscle] || c.accent;
          const label = MUSCLE_LABELS[item.muscle] || item.muscle;

          return (
            <React.Fragment key={item.muscle}>
              {/* Muscle label */}
              <SvgText
                x={0}
                y={y + 17}
                fontSize={11}
                fill={c.textSecondary}
                fontWeight="600"
              >
                {label}
              </SvgText>
              {/* Background bar */}
              <Rect
                x={100}
                y={y + 4}
                width={BAR_WIDTH}
                height={16}
                rx={4}
                fill={c.isDark ? '#222' : '#EBEDF0'}
              />
              {/* Filled bar */}
              <Rect
                x={100}
                y={y + 4}
                width={Math.max(barW, 4)}
                height={16}
                rx={4}
                fill={color}
                opacity={0.85}
              />
              {/* Sets count */}
              <SvgText
                x={100 + BAR_WIDTH + 8}
                y={y + 17}
                fontSize={11}
                fill={c.text}
                fontWeight="700"
              >
                {item.sets}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={s.legendRow}>
        <Text style={s.legendText}>Sets per muscle group (last 7 days)</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      paddingVertical: 8,
    },
    emptyContainer: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    legendRow: {
      marginTop: 8,
      alignItems: 'center',
    },
    legendText: {
      fontSize: 11,
      color: c.textTertiary,
    },
  });
}
