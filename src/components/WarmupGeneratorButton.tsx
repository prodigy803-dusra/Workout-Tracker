/**
 * WarmupGeneratorButton — generates warm-up sets for an exercise.
 *
 * Extracted from LogScreen IIFE (§4: no business logic in JSX).
 */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { styles } from '../screens/LogScreen.styles';
import { haptic } from '../utils/haptics';

type Props = {
  onGenerate: () => void;
};

function WarmupGeneratorButton({ onGenerate }: Props) {
  const c = useColors();

  return (
    <Pressable
      onPress={() => {
        haptic('light');
        onGenerate();
      }}
      style={[styles.warmupBtn, { borderColor: c.accent, backgroundColor: c.accentBg }]}
    >
      <Text style={[styles.warmupBtnText, { color: c.accent }]}>🔥 Generate Warm-Up Sets</Text>
    </Pressable>
  );
}

export default React.memo(WarmupGeneratorButton);
