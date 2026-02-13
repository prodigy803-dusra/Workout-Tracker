/**
 * DropSegmentRow — a single drop-set segment (weight × reps) with delete.
 *
 * Architecture rule §2: keeps raw string during typing, commits on blur.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { styles } from '../screens/LogScreen.styles';
import { haptic } from '../utils/haptics';

type Props = {
  segmentId: number;
  weight: number;
  reps: number;
  onCommitWeight: (raw: string) => void;
  onCommitReps: (raw: string) => void;
  onDelete: () => void;
};

function DropSegmentRow({ segmentId, weight, reps, onCommitWeight, onCommitReps, onDelete }: Props) {
  const c = useColors();

  // §2: local raw strings for typing — no parsing until blur
  const [rawWeight, setRawWeight] = useState(String(weight));
  const [rawReps, setRawReps] = useState(String(reps));

  return (
    <View style={[styles.dropSegmentRow, { borderBottomColor: c.border }]}>
      <Text style={[styles.dropArrow, { color: c.textTertiary }]}>↳</Text>
      <TextInput
        value={rawWeight}
        onChangeText={setRawWeight}
        onEndEditing={() => onCommitWeight(rawWeight)}
        keyboardType="numeric"
        placeholder="Wt"
        placeholderTextColor={c.textTertiary}
        style={[styles.dropInput, { color: c.text, backgroundColor: c.inputBg, borderColor: c.border }]}
      />
      <Text style={[styles.dropX, { color: c.textTertiary }]}>×</Text>
      <TextInput
        value={rawReps}
        onChangeText={setRawReps}
        onEndEditing={() => onCommitReps(rawReps)}
        keyboardType="number-pad"
        placeholder="Reps"
        placeholderTextColor={c.textTertiary}
        style={[styles.dropInput, { width: 52, color: c.text, backgroundColor: c.inputBg, borderColor: c.border }]}
      />
      <Pressable
        hitSlop={8}
        onPress={() => {
          haptic('light');
          onDelete();
        }}
      >
        <Text style={[styles.dropDeleteBtn, { color: c.danger }]}>✕</Text>
      </Pressable>
    </View>
  );
}

export default React.memo(DropSegmentRow);
