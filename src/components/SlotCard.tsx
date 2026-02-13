/**
 * SlotCard — expandable exercise card containing set rows, suggestions, warmups.
 *
 * Architecture rules applied:
 * §3: dispatches callbacks upward, no direct side effects
 * §4: pure projection — suggestions pre-computed via props
 */
import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../contexts/ThemeContext';
import { styles } from '../screens/LogScreen.styles';
import OptionChips from './OptionChips';
import SetRowEditor from './SetRowEditor';
import ProgressiveOverloadBanner from './ProgressiveOverloadBanner';
import WarmupGeneratorButton from './WarmupGeneratorButton';
import type { DraftSlot, SlotOption, SetData, LastTimeData } from '../types';
import type { DropSegment } from '../hooks/useSessionStore';

type Props = {
  slot: DraftSlot;
  options: SlotOption[];
  sets: SetData[];
  drops: Record<number, DropSegment[]>;
  lastTime: LastTimeData;
  isExpanded: boolean;
  unit: string;
  onToggleExpand: (slotId: number) => void;
  onSelectChoice: (slotId: number, templateOptionId: number) => void;
  // Set callbacks
  onToggleComplete: (setId: number, completed: boolean, rawWeight?: string, rawReps?: string) => void;
  onCommitWeight: (setId: number, raw: string) => void;
  onCommitReps: (setId: number, raw: string) => void;
  onCycleRpe: (setId: number) => void;
  onDeleteSet: (choiceId: number, setIndex: number) => void;
  onOpenPlateCalc: (weight: number) => void;
  // Drop callbacks
  onAddDrop: (setId: number) => void;
  onCommitDropWeight: (setId: number, segmentId: number, raw: string) => void;
  onCommitDropReps: (setId: number, segmentId: number, raw: string) => void;
  onDeleteDrop: (setId: number, segmentId: number) => void;
  // Warmup
  onGenerateWarmups: (choiceId: number, workingWeight: number) => void;
};

function SlotCard({
  slot,
  options,
  sets,
  drops,
  lastTime,
  isExpanded,
  unit,
  onToggleExpand,
  onSelectChoice,
  onToggleComplete,
  onCommitWeight,
  onCommitReps,
  onCycleRpe,
  onDeleteSet,
  onOpenPlateCalc,
  onAddDrop,
  onCommitDropWeight,
  onCommitDropReps,
  onDeleteDrop,
  onGenerateWarmups,
}: Props) {
  const c = useColors();
  const navigation = useNavigation<any>();
  const selectedChoiceId = slot.selected_session_slot_choice_id;
  if (!selectedChoiceId) return null;

  const completedCount = sets.filter((s) => s.completed).length;

  const handleToggleExpand = useCallback(() => {
    onToggleExpand(slot.session_slot_id);
  }, [slot.session_slot_id, onToggleExpand]);

  // §4: Pre-compute progressive overload suggestion
  const overloadSuggestion = (() => {
    if (!lastTime || lastTime.sets.length === 0) return null;
    const allCompleted = lastTime.sets.every((s) => s.completed);
    if (!allCompleted) return null;
    const heaviest = lastTime.sets.reduce(
      (max, s) => (s.weight > max.weight ? s : max),
      lastTime.sets[0],
    );
    const increment = unit === 'lb' ? 5 : 2.5;
    return { suggestedWeight: heaviest.weight + increment, suggestedReps: heaviest.reps };
  })();

  // §4: Pre-compute whether warmup should show
  const showWarmup =
    sets.length > 0 &&
    !sets.some((s) => s.completed) &&
    sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0]).weight > 0;

  const heaviestWeight = sets.length > 0
    ? sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0]).weight
    : 0;

  return (
    <View style={[styles.slotCard, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Header (expandable) */}
      <Pressable
        onPress={handleToggleExpand}
        style={[styles.slotHeader, { backgroundColor: c.sectionHeaderBg }]}
      >
        <View style={styles.slotHeaderContent}>
          {slot.name && <Text style={[styles.slotSubtitle, { color: c.textSecondary }]}>{slot.name}</Text>}
          <View style={styles.slotTitleRow}>
            <Text style={[styles.slotTitle, { color: c.text }]}>
              {slot.exercise_name}
              {slot.option_name ? ` (${slot.option_name})` : ''}
            </Text>
            {slot.exercise_id && (
              <Pressable
                hitSlop={8}
                onPress={(e) => {
                  e.stopPropagation?.();
                  navigation.navigate('Exercises', {
                    screen: 'ExerciseDetail',
                    params: { exerciseId: slot.exercise_id, name: slot.exercise_name },
                  });
                }}
                style={[styles.infoBtn, { backgroundColor: c.sectionHeaderBg }]}
              >
                <Text style={[styles.infoBtnText, { color: c.textSecondary }]}>?</Text>
              </Pressable>
            )}
          </View>
          {sets.length > 0 && (
            <Text style={[styles.progressText, { color: c.success }]}>
              {completedCount}/{sets.length} sets done
            </Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: c.textSecondary }]}>{isExpanded ? '▼' : '▶'}</Text>
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.slotContent}>
          <OptionChips
            options={options}
            selectedTemplateOptionId={slot.template_slot_option_id ?? 0}
            onSelect={(templateSlotOptionId) => onSelectChoice(slot.session_slot_id, templateSlotOptionId)}
          />

          {overloadSuggestion && (
            <ProgressiveOverloadBanner
              suggestedWeight={overloadSuggestion.suggestedWeight}
              suggestedReps={overloadSuggestion.suggestedReps}
              unit={unit}
            />
          )}

          {showWarmup && (
            <WarmupGeneratorButton
              onGenerate={() => onGenerateWarmups(selectedChoiceId, heaviestWeight)}
            />
          )}

          {sets.length === 0 ? (
            <Text style={[styles.noSetsText, { color: c.textTertiary }]}>
              No prescribed sets. Add sets in the template editor.
            </Text>
          ) : (
            <>
              <View style={styles.setsHeader}>
                <Text style={[styles.colLabel, { width: 36, color: c.textTertiary }]} />
                <Text style={[styles.colLabel, { color: c.textTertiary }]}>#</Text>
                <Text style={[styles.colLabel, { flex: 1, color: c.textTertiary }]}>Weight ({unit})</Text>
                <Text style={[styles.colLabel, { width: 64, color: c.textTertiary }]}>Reps</Text>
                <Text style={[styles.colLabel, { width: 52, color: c.textTertiary }]}>RPE</Text>
              </View>

              {sets.map((s) => (
                <SetRowEditor
                  key={s.set_index}
                  set={s}
                  choiceId={selectedChoiceId}
                  unit={unit}
                  drops={drops[s.id] || []}
                  onToggleComplete={onToggleComplete}
                  onCommitWeight={onCommitWeight}
                  onCommitReps={onCommitReps}
                  onCycleRpe={onCycleRpe}
                  onDeleteSet={(setIndex) => onDeleteSet(selectedChoiceId, setIndex)}
                  onAddDrop={onAddDrop}
                  onCommitDropWeight={onCommitDropWeight}
                  onCommitDropReps={onCommitDropReps}
                  onDeleteDrop={onDeleteDrop}
                  onOpenPlateCalc={onOpenPlateCalc}
                />
              ))}
            </>
          )}

          {/* Last Time panel */}
          {lastTime && (
            <View style={[styles.lastTimeContainer, { backgroundColor: c.sectionHeaderBg, borderColor: c.border }]}>
              <Text style={[styles.lastTimeTitle, { color: c.textSecondary }]}>
                Last time — {new Date(lastTime.performed_at).toLocaleDateString()}
              </Text>
              <View style={styles.lastTimeSets}>
                {lastTime.sets.map((ls, i: number) => (
                  <Text key={i} style={[styles.lastTimeSet, { color: c.textSecondary }]}>
                    Set {ls.set_index}: {ls.weight} {unit} × {ls.reps}
                    {ls.rpe ? ` @${ls.rpe}` : ''}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default React.memo(SlotCard);
