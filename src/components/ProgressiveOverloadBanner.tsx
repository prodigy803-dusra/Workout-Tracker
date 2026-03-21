/**
 * ProgressiveOverloadBanner — suggestion to increase weight.
 *
 * Extracted from LogScreen IIFE (§4: no business logic in JSX).
 * Pre-computed props passed in; this component just renders.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { styles } from '../screens/LogScreen.styles';

type Props = {
  suggestedWeight: number;
  suggestedReps: number;
  unit: string;
  /** Top weight has stalled and volume has not improved for 2+ sessions */
  stagnant?: boolean;
  /** How many consecutive sessions at the same weight */
  stagnantCount?: number;
  /** Assisted exercise — weight is counterweight, less = harder */
  assisted?: boolean;
};

function ProgressiveOverloadBanner({ suggestedWeight, suggestedReps, unit, stagnant, stagnantCount, assisted }: Props) {
  const c = useColors();

  if (stagnant) {
    const action = assisted
      ? `try reducing to ${suggestedWeight} ${unit} assist × ${suggestedReps}`
      : `consider adding ${suggestedWeight} ${unit} × ${suggestedReps}, or try a different rep range/variation`;
    return (
      <View style={[styles.suggestionBanner, { backgroundColor: c.isDark ? '#2A1A00' : '#FFF3E0', borderColor: c.isDark ? '#804A00' : '#FFB74D' }]}>
        <Text style={styles.suggestionIcon}>⚠️</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.suggestionText, { color: c.isDark ? '#FFB74D' : '#E65100' }]}>
            Same {assisted ? 'assist level' : 'top weight'} with no volume improvement for {stagnantCount} sessions — {action}
          </Text>
        </View>
      </View>
    );
  }

  // Non-stagnant: should not reach here since callers only set stagnant=true,
  // but keep a minimal fallback for safety
  const label = assisted
    ? `Try reducing assist to ${suggestedWeight} ${unit} × ${suggestedReps}`
    : `Try ${suggestedWeight} ${unit} × ${suggestedReps}`;
  return (
    <View style={[styles.suggestionBanner, { backgroundColor: c.warningBg, borderColor: c.isDark ? '#665A00' : '#F5D76E' }]}>
      <Text style={styles.suggestionIcon}>{assisted ? '💪' : '📈'}</Text>
      <Text style={[styles.suggestionText, { color: c.warningText }]}>{label}</Text>
    </View>
  );
}

export default React.memo(ProgressiveOverloadBanner);
