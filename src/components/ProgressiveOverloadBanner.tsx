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
};

function ProgressiveOverloadBanner({ suggestedWeight, suggestedReps, unit }: Props) {
  const c = useColors();

  return (
    <View style={[styles.suggestionBanner, { backgroundColor: c.warningBg, borderColor: c.isDark ? '#665A00' : '#F5D76E' }]}>
      <Text style={styles.suggestionIcon}>📈</Text>
      <Text style={[styles.suggestionText, { color: c.warningText }]}>
        You completed all sets last session — try {suggestedWeight} {unit} × {suggestedReps}
      </Text>
    </View>
  );
}

export default React.memo(ProgressiveOverloadBanner);
