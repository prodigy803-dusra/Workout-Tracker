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
import { haptic } from '../utils/haptics';
import OptionChips from './OptionChips';
import SetRowEditor from './SetRowEditor';
import ProgressiveOverloadBanner from './ProgressiveOverloadBanner';
import WarmupGeneratorButton from './WarmupGeneratorButton';
import type { DraftSlot, SlotOption, SetData, LastTimeData } from '../types';
import type { DropSegment } from '../hooks/useSessionStore';

export type InjuryWarning = {
  icon: string;
  label: string;
  severity: 'mild' | 'moderate' | 'severe';
  color: string;
  message: string;
};

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
  // Mid-workout editing
  onAddSet: (choiceId: number) => void;
  onRemoveExercise: (sessionSlotId: number, exerciseName: string) => void;
  onMoveUp: (sessionSlotId: number) => void;
  onMoveDown: (sessionSlotId: number) => void;
  isFirst: boolean;
  isLast: boolean;
  // Warmup management
  onClearWarmups: (choiceId: number) => void;
  /** Injury warnings for this exercise, if any active injuries affect it */
  injuryWarnings?: InjuryWarning[];
  /** Number of recent consecutive sessions at the same top weight (0 = not stagnant) */
  stagnantSessions?: number;
  /** True if this is an assisted exercise (weight = counterweight, more weight = easier) */
  isAssisted?: boolean;
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
  onAddSet,
  onRemoveExercise,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onClearWarmups,
  injuryWarnings,
  stagnantSessions = 0,
  isAssisted = false,
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
    const increment = unit === 'lb' ? 5 : 2.5;
    if (isAssisted) {
      // Assisted: lightest weight = hardest. Suggest LESS assistance.
      const lightest = lastTime.sets.reduce(
        (min, s) => (s.weight < min.weight ? s : min),
        lastTime.sets[0],
      );
      const nextWeight = Math.max(0, lightest.weight - increment);
      return {
        suggestedWeight: nextWeight,
        suggestedReps: lightest.reps,
        stagnant: stagnantSessions >= 3,
        stagnantCount: stagnantSessions,
        assisted: true,
      };
    }
    const heaviest = lastTime.sets.reduce(
      (max, s) => (s.weight > max.weight ? s : max),
      lastTime.sets[0],
    );
    return {
      suggestedWeight: heaviest.weight + increment,
      suggestedReps: heaviest.reps,
      stagnant: stagnantSessions >= 3,
      stagnantCount: stagnantSessions,
      assisted: false,
    };
  })();

  // §4: Pre-compute whether warmup should show
  const hasWarmups = sets.some((s) => s.is_warmup);
  const workingSets = sets.filter((s) => !s.is_warmup);
  const showWarmupGenerate =
    sets.length > 0 &&
    !hasWarmups &&
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
        onLongPress={() => onRemoveExercise(slot.session_slot_id, slot.exercise_name || 'this exercise')}
        delayLongPress={600}
        style={[styles.slotHeader, { backgroundColor: c.sectionHeaderBg }]}
      >
        <View style={styles.slotHeaderContent}>
          {slot.name && <Text style={[styles.slotSubtitle, { color: c.textSecondary }]}>{slot.name}</Text>}
          <View style={styles.slotTitleRow}>
            <Text style={[styles.slotTitle, { color: c.text }]}>
              {slot.exercise_name}
              {slot.option_name ? ` (${slot.option_name})` : ''}
              {isAssisted ? ' 🔄' : ''}
            </Text>
            {/* Reorder + info buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {!isFirst && (
                <Pressable
                  hitSlop={6}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    haptic('selection');
                    onMoveUp(slot.session_slot_id);
                  }}
                  style={[styles.infoBtn, { backgroundColor: c.sectionHeaderBg }]}
                >
                  <Text style={[styles.infoBtnText, { color: c.textSecondary }]}>▲</Text>
                </Pressable>
              )}
              {!isLast && (
                <Pressable
                  hitSlop={6}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    haptic('selection');
                    onMoveDown(slot.session_slot_id);
                  }}
                  style={[styles.infoBtn, { backgroundColor: c.sectionHeaderBg }]}
                >
                  <Text style={[styles.infoBtnText, { color: c.textSecondary }]}>▼</Text>
                </Pressable>
              )}
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

          {/* Injury warning banners */}
          {injuryWarnings && injuryWarnings.length > 0 && injuryWarnings.map((w, idx) => (
            <View
              key={idx}
              style={[
                styles.suggestionBanner,
                {
                  backgroundColor: w.color + '18',
                  borderColor: w.color + '55',
                  borderWidth: 1,
                  borderRadius: 10,
                  marginBottom: 8,
                },
              ]}
            >
              <Text style={styles.suggestionIcon}>{w.icon}</Text>
              <Text style={[styles.suggestionText, { color: w.color }]}>
                {w.message}
              </Text>
            </View>
          ))}

          {overloadSuggestion && (!injuryWarnings || injuryWarnings.length === 0) && (
            <ProgressiveOverloadBanner
              suggestedWeight={overloadSuggestion.suggestedWeight}
              suggestedReps={overloadSuggestion.suggestedReps}
              unit={unit}
              stagnant={overloadSuggestion.stagnant}
              stagnantCount={overloadSuggestion.stagnantCount}
              assisted={overloadSuggestion.assisted}
            />
          )}

          {showWarmupGenerate && (
            <WarmupGeneratorButton
              onGenerate={() => onGenerateWarmups(selectedChoiceId, heaviestWeight)}
            />
          )}

          {/* Warmup management: regenerate + clear */}
          {hasWarmups && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Pressable
                onPress={() => {
                  haptic('light');
                  onGenerateWarmups(selectedChoiceId, heaviestWeight);
                }}
                style={[styles.warmupBtn, { flex: 1, borderColor: c.accent, backgroundColor: c.accentBg }]}
              >
                <Text style={[styles.warmupBtnText, { color: c.accent }]}>🔄 Regenerate</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptic('light');
                  onClearWarmups(selectedChoiceId);
                }}
                style={[styles.warmupBtn, { flex: 1, borderColor: c.danger, backgroundColor: c.card }]}
              >
                <Text style={[styles.warmupBtnText, { color: c.danger }]}>✕ Clear Warmups</Text>
              </Pressable>
            </View>
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
                <Text style={[styles.colLabel, { flex: 1, color: c.textTertiary }]}>{isAssisted ? `Assist (${unit})` : `Weight (${unit})`}</Text>
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

          {/* Add Set button */}
          <Pressable
            onPress={() => {
              haptic('light');
              onAddSet(selectedChoiceId);
            }}
            style={[styles.addSetBtn, { borderColor: c.accent, backgroundColor: c.accentBg }]}
          >
            <Text style={[styles.addSetBtnText, { color: c.accent }]}>＋ Add Set</Text>
          </Pressable>

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
