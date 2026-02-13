/**
 * SetRowEditor — single set row: completion radio, weight, reps, RPE.
 *
 * Architecture rules applied:
 * §2: Raw string kept during typing, commit on blur/submit.
 * §3: Dispatches callbacks, does not trigger side effects directly.
 * §4: Pure projection of props.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Animated as RNAnimated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useColors } from '../contexts/ThemeContext';
import { styles } from '../screens/LogScreen.styles';
import { haptic } from '../utils/haptics';
import type { SetData } from '../types';
import type { DropSegment } from '../hooks/useSessionStore';
import DropSegmentRow from './DropSegmentRow';

type Props = {
  set: SetData;
  choiceId: number;
  unit: string;
  drops: DropSegment[];
  onToggleComplete: (setId: number, completed: boolean, rawWeight?: string, rawReps?: string) => void;
  onCommitWeight: (setId: number, raw: string) => void;
  onCommitReps: (setId: number, raw: string) => void;
  onCycleRpe: (setId: number) => void;
  onDeleteSet: (setIndex: number) => void;
  onAddDrop: (setId: number) => void;
  onCommitDropWeight: (setId: number, segmentId: number, raw: string) => void;
  onCommitDropReps: (setId: number, segmentId: number, raw: string) => void;
  onDeleteDrop: (setId: number, segmentId: number) => void;
  onOpenPlateCalc: (weight: number) => void;
};

function SetRowEditor({
  set: s,
  choiceId,
  unit,
  drops,
  onToggleComplete,
  onCommitWeight,
  onCommitReps,
  onCycleRpe,
  onDeleteSet,
  onAddDrop,
  onCommitDropWeight,
  onCommitDropReps,
  onDeleteDrop,
  onOpenPlateCalc,
}: Props) {
  const c = useColors();

  // §2: Local raw strings — exact user keystrokes until blur
  const [rawWeight, setRawWeight] = useState(String(s.weight));
  const [rawReps, setRawReps] = useState(String(s.reps));

  // Sync from props when set data changes externally (e.g. hydrate after warmup gen)
  React.useEffect(() => {
    setRawWeight(String(s.weight));
  }, [s.weight]);
  React.useEffect(() => {
    setRawReps(String(s.reps));
  }, [s.reps]);

  const handleToggle = useCallback(() => {
    if (!s.completed) {
      haptic('medium');
      // Pass current raw TextInput values so parent can persist them
      // before the slot collapses and unmounts the inputs
      onToggleComplete(s.id, true, rawWeight, rawReps);
    } else {
      onToggleComplete(s.id, false);
    }
  }, [s.id, s.completed, onToggleComplete, rawWeight, rawReps]);

  const handleCycleRpe = useCallback(() => {
    haptic('selection');
    onCycleRpe(s.id);
  }, [s.id, onCycleRpe]);

  return (
    <React.Fragment>
      <Swipeable
        friction={2}
        rightThreshold={40}
        renderRightActions={(_progress, dragX) => {
          const scale = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0.5],
            extrapolate: 'clamp',
          });
          return (
            <Pressable
              onPress={() => {
                haptic('error');
                onDeleteSet(s.set_index);
              }}
              style={[styles.swipeDelete, { backgroundColor: c.danger }]}
            >
              <RNAnimated.Text style={[styles.swipeDeleteText, { transform: [{ scale }] }]}>
                🗑️
              </RNAnimated.Text>
            </Pressable>
          );
        }}
      >
        <View
          style={[
            styles.setRow,
            { borderBottomColor: c.border },
            s.completed && { backgroundColor: c.completedBg },
          ]}
        >
          {/* Completion radio */}
          <Pressable style={[styles.radio, { borderColor: c.border }]} onPress={handleToggle}>
            {s.completed && <View style={[styles.radioFill, { backgroundColor: c.success }]} />}
          </Pressable>

          {/* Set index */}
          <Text style={[styles.setIndex, { color: c.textSecondary }, s.completed && styles.completedText]}>
            #{s.set_index}
          </Text>

          {/* Weight input — §2: raw string, commit on blur */}
          <TextInput
            value={rawWeight}
            onChangeText={setRawWeight}
            onEndEditing={() => onCommitWeight(s.id, rawWeight)}
            onSubmitEditing={() => {
              const w = parseFloat(rawWeight);
              if (w > 0) onOpenPlateCalc(w);
            }}
            keyboardType="numeric"
            placeholderTextColor={c.textTertiary}
            style={[
              styles.setInput,
              { flex: 1, color: c.text, backgroundColor: c.inputBg, borderColor: c.border },
              s.completed && { color: c.textTertiary, backgroundColor: c.completedBg, borderColor: c.completedBorder },
            ]}
          />

          {/* Reps input — §2: raw string, commit on blur */}
          <TextInput
            value={rawReps}
            onChangeText={setRawReps}
            onEndEditing={() => onCommitReps(s.id, rawReps)}
            keyboardType="number-pad"
            placeholderTextColor={c.textTertiary}
            style={[
              styles.setInput,
              { width: 64, color: c.text, backgroundColor: c.inputBg, borderColor: c.border },
              s.completed && { color: c.textTertiary, backgroundColor: c.completedBg, borderColor: c.completedBorder },
            ]}
          />

          {/* RPE chip */}
          <Pressable
            onPress={handleCycleRpe}
            style={[
              styles.rpeChip,
              {
                backgroundColor: s.rpe == null ? c.inputBg
                  : s.rpe <= 7 ? (c.isDark ? '#1A2E1F' : '#E6F9ED')
                  : s.rpe <= 8.5 ? (c.isDark ? '#3A3420' : '#FFF8E1')
                  : (c.isDark ? '#3A1A1A' : '#FFEBEE'),
                borderColor: s.rpe == null ? c.border
                  : s.rpe <= 7 ? c.success
                  : s.rpe <= 8.5 ? c.warning
                  : c.danger,
              },
            ]}
          >
            <Text
              style={[
                styles.rpeChipText,
                {
                  color: s.rpe == null ? c.textTertiary
                    : s.rpe <= 7 ? c.success
                    : s.rpe <= 8.5 ? (c.isDark ? c.warning : '#B8860B')
                    : c.danger,
                },
              ]}
            >
              {s.rpe != null ? `@${s.rpe}` : 'RPE'}
            </Text>
          </Pressable>
        </View>
      </Swipeable>

      {/* Drop-set segments */}
      {drops.map((seg) => (
        <DropSegmentRow
          key={`drop-${seg.id}`}
          segmentId={seg.id}
          weight={seg.weight}
          reps={seg.reps}
          onCommitWeight={(raw) => onCommitDropWeight(s.id, seg.id, raw)}
          onCommitReps={(raw) => onCommitDropReps(s.id, seg.id, raw)}
          onDelete={() => onDeleteDrop(s.id, seg.id)}
        />
      ))}

      {/* Add drop-set button */}
      {s.weight > 0 && (
        <Pressable
          onPress={() => {
            haptic('selection');
            onAddDrop(s.id);
          }}
          style={styles.addDropBtn}
        >
          <Text style={[styles.addDropBtnText, { color: c.accent }]}>
            ↓ Drop Set
          </Text>
        </Pressable>
      )}
    </React.Fragment>
  );
}

export default React.memo(SetRowEditor);
