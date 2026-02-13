/**
 * SessionSummaryHeader — duration / sets / volume progress bar.
 *
 * Pure presentational component (§4: UI is a pure projection of state).
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { styles } from '../screens/LogScreen.styles';

type Props = {
  elapsed: number;
  completedSets: number;
  totalSets: number;
  totalVolume: number;
  unit: string;
};

function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function SessionSummaryHeader({ elapsed, completedSets, totalSets, totalVolume, unit }: Props) {
  const c = useColors();

  return (
    <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>{formatElapsed(elapsed)}</Text>
          <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Duration</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>{completedSets}/{totalSets}</Text>
          <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Sets</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: c.text }]}>
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
          </Text>
          <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Volume ({unit})</Text>
        </View>
      </View>
      {totalSets > 0 && (
        <View style={[styles.progressBarBg, { backgroundColor: c.isDark ? '#333' : '#E8E8E8' }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(completedSets / totalSets) * 100}%`, backgroundColor: c.success },
            ]}
          />
        </View>
      )}
    </View>
  );
}

export default React.memo(SessionSummaryHeader);
