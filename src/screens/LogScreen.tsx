/**
 * LogScreenV2 — refactored workout logging screen.
 *
 * This is the dev/parallel version of LogScreen. The original LogScreen.tsx
 * remains untouched so the production app is not affected.
 *
 * Architecture rules applied:
 * §1: Single useSessionStore for all workout state (no scattered useState).
 * §2: TextInputs keep raw strings; commit on blur (handled by sub-components).
 * §3: User actions dispatch to reducer; side effects triggered after dispatch.
 * §4: JSX is a pure projection — no IIFEs, no inline business logic.
 * §6: Thin orchestrator (~300 lines) delegating to focused sub-components.
 */
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Alert, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useKeepAwake } from 'expo-keep-awake';
import { useSessionStore } from '../hooks/useSessionStore';
import { useRestTimer } from '../hooks/useRestTimer';
import type { NextSetInfo, NextExerciseInfo } from '../hooks/useRestTimer';
import { useUnit } from '../contexts/UnitContext';
import { useColors } from '../contexts/ThemeContext';
import { haptic } from '../utils/haptics';
import { discardDraft } from '../db/repositories/sessionsRepo';
import IdleScreen from '../components/IdleScreen';
import SessionSummaryHeader from '../components/SessionSummaryHeader';
import SlotCard from '../components/SlotCard';
import RestTimerModal from '../components/RestTimerModal';
import PlateCalculator from '../components/PlateCalculator';
import type { SetData, LogStackParamList } from '../types';
import { styles } from './LogScreen.styles';

export default function LogScreenV2() {
  const navigation = useNavigation<NativeStackNavigationProp<LogStackParamList>>();
  const { unit } = useUnit();
  const c = useColors();
  const timer = useRestTimer();
  const { state, dispatch, hydrate, persistSetCompletion, persistSet, persistDeleteSet, persistSelectChoice, persistNotes, persistFinish, persistDiscard, persistDropSegment, persistUpdateDrop, persistDeleteDrop, persistGenerateWarmups } = useSessionStore();

  /* ── UI-only local state (§1: allowed) ── */
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [plateCalcVisible, setPlateCalcVisible] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState(0);
  const [rawNotes, setRawNotes] = useState('');

  /* ── Session elapsed timer ── */
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep screen awake during active workout
  useKeepAwake('active-workout');

  // Prevent accidental back-navigation
  useEffect(() => {
    if (!state.draft) return;
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (e.data.action.type === 'RESET' || e.data.action.type === 'REPLACE') return;
      e.preventDefault();
      Alert.alert(
        'Leave workout?',
        'You have an active workout in progress. Are you sure you want to leave? Your workout will still be here when you come back.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsub;
  }, [navigation, state.draft]);

  // Elapsed timer
  useEffect(() => {
    if (!state.draft) {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      return;
    }
    const startTime = new Date(state.draft.created_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    elapsedRef.current = setInterval(tick, 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [state.draft]);

  // Sync raw notes from store
  useEffect(() => {
    setRawNotes(state.sessionNotes);
  }, [state.sessionNotes]);

  // Hydrate on focus
  useFocusEffect(
    useCallback(() => {
      void hydrate();
    }, [hydrate]),
  );

  // Auto-expand first incomplete slot after hydrate
  useEffect(() => {
    if (state.phase !== 'active') return;
    for (const slot of state.slots) {
      const choiceId = slot.selected_session_slot_choice_id;
      if (!choiceId) continue;
      const sets = state.setsByChoice[choiceId] || [];
      if (sets.some((x) => !x.completed)) {
        setExpandedSlots(new Set([slot.session_slot_id]));
        return;
      }
    }
  }, [state.phase]); // only on phase transition, not every render

  /* ── Derived values (§4: computed via useMemo) ── */
  const { totalSets, completedSets, totalVolume } = useMemo(() => {
    let total = 0, completed = 0, volume = 0;
    for (const sets of Object.values(state.setsByChoice)) {
      for (const s of sets) {
        total++;
        if (s.completed) {
          completed++;
          volume += (s.weight || 0) * (s.reps || 0);
          const drops = state.dropsBySet[s.id] || [];
          for (const d of drops) {
            volume += (d.weight || 0) * (d.reps || 0);
          }
        }
      }
    }
    return { totalSets: total, completedSets: completed, totalVolume: volume };
  }, [state.setsByChoice, state.dropsBySet]);

  /* ── Action handlers (§3: dispatch + side effect) ── */

  const handleToggleComplete = useCallback(async (setId: number, completed: boolean, rawWeight?: string, rawReps?: string) => {
    const choiceId = findChoiceIdForSet(setId);
    if (choiceId == null) return;

    if (completed) {
      // Use raw TextInput values if available (they're more current than reducer state
      // because onEndEditing may not have fired yet — especially on the last set
      // where completing collapses the slot and unmounts the TextInput)
      const currentSets = state.setsByChoice[choiceId] || [];
      const set = currentSets.find((s) => s.id === setId);
      if (set) {
        const weight = rawWeight != null ? (rawWeight === '' ? 0 : (parseFloat(rawWeight) || 0)) : set.weight;
        const reps = rawReps != null ? (rawReps === '' ? 0 : (parseInt(rawReps, 10) || 0)) : set.reps;
        await persistSet(choiceId, set.set_index, weight, reps, set.rpe, set.rest_seconds);
        // Sync reducer state so subsequent reads see the correct values
        if (rawWeight != null) dispatch({ type: 'COMMIT_WEIGHT', setId, choiceId, raw: rawWeight });
        if (rawReps != null) dispatch({ type: 'COMMIT_REPS', setId, choiceId, raw: rawReps });
      }

      dispatch({ type: 'COMPLETE_SET', setId, choiceId });
      await persistSetCompletion(setId, true);

      // §3: side effects after state change

      // Auto-expand next slot if this slot is fully done
      const updatedSets = currentSets.map((s) => s.id === setId ? { ...s, completed: true } : s);
      if (updatedSets.every((x) => x.completed)) {
        const currentSlot = state.slots.find((sl) => sl.selected_session_slot_choice_id === choiceId);
        if (currentSlot) {
          const currentIdx = state.slots.indexOf(currentSlot);
          for (let i = currentIdx + 1; i < state.slots.length; i++) {
            const nextSlot = state.slots[i];
            const nextChoiceId = nextSlot.selected_session_slot_choice_id;
            if (!nextChoiceId) continue;
            const nextSets = state.setsByChoice[nextChoiceId] || [];
            if (nextSets.some((x: SetData) => !x.completed)) {
              setExpandedSlots((prev) => {
                const n = new Set(prev);
                if (currentSlot) n.delete(currentSlot.session_slot_id);
                n.add(nextSlot.session_slot_id);
                return n;
              });
              break;
            }
          }
        }
      }

      // Start rest timer
      if (set?.rest_seconds && set.rest_seconds > 0) {
        const timerContext = computeTimerContext(setId, choiceId);
        timer.start(set.rest_seconds, timerContext);
      }
    } else {
      dispatch({ type: 'UNCOMPLETE_SET', setId, choiceId });
      await persistSetCompletion(setId, false);
    }
  }, [state.setsByChoice, state.slots, dispatch, persistSetCompletion, timer]);

  const handleCommitWeight = useCallback(async (setId: number, raw: string) => {
    const choiceId = findChoiceIdForSet(setId);
    if (choiceId == null) return;
    dispatch({ type: 'COMMIT_WEIGHT', setId, choiceId, raw });
    const set = state.setsByChoice[choiceId]?.find((s) => s.id === setId);
    if (set) {
      const weight = raw === '' ? 0 : (parseFloat(raw) || 0);
      await persistSet(choiceId, set.set_index, weight, set.reps, set.rpe, set.rest_seconds);
    }
  }, [state.setsByChoice, dispatch, persistSet]);

  const handleCommitReps = useCallback(async (setId: number, raw: string) => {
    const choiceId = findChoiceIdForSet(setId);
    if (choiceId == null) return;
    dispatch({ type: 'COMMIT_REPS', setId, choiceId, raw });
    const set = state.setsByChoice[choiceId]?.find((s) => s.id === setId);
    if (set) {
      const reps = raw === '' ? 0 : (parseInt(raw, 10) || 0);
      await persistSet(choiceId, set.set_index, set.weight, reps, set.rpe, set.rest_seconds);
    }
  }, [state.setsByChoice, dispatch, persistSet]);

  const handleCycleRpe = useCallback(async (setId: number) => {
    const choiceId = findChoiceIdForSet(setId);
    if (choiceId == null) return;
    dispatch({ type: 'CYCLE_RPE', setId, choiceId });
    // Persist with the new RPE value that the reducer will compute
    const set = state.setsByChoice[choiceId]?.find((s) => s.id === setId);
    if (set) {
      const rpeOrder: (number | null)[] = [null, 6, 7, 8, 9, 10];
      const idx = rpeOrder.indexOf(set.rpe);
      const nextRpe = rpeOrder[(idx + 1) % rpeOrder.length];
      await persistSet(choiceId, set.set_index, set.weight, set.reps, nextRpe, set.rest_seconds);
    }
  }, [state.setsByChoice, dispatch, persistSet]);

  const handleDeleteSet = useCallback(async (choiceId: number, setIndex: number) => {
    haptic('error');
    dispatch({ type: 'DELETE_SET', choiceId, setIndex });
    await persistDeleteSet(choiceId, setIndex);
  }, [dispatch, persistDeleteSet]);

  const handleSelectChoice = useCallback(async (slotId: number, templateOptionId: number) => {
    await persistSelectChoice(slotId, templateOptionId);
    await hydrate(); // re-fetch everything since slot selection changes sets
  }, [persistSelectChoice, hydrate]);

  const handleAddDrop = useCallback(async (setId: number) => {
    const existingDrops = state.dropsBySet[setId] || [];
    const nextIndex = existingDrops.length > 0
      ? Math.max(...existingDrops.map((d) => d.segment_index)) + 1
      : 1;
    const choiceId = findChoiceIdForSet(setId);
    const set = choiceId != null ? state.setsByChoice[choiceId]?.find((s) => s.id === setId) : null;
    const lastWeight = existingDrops.length > 0 ? existingDrops[existingDrops.length - 1].weight : (set?.weight ?? 0);
    const roundTo = unit === 'kg' ? 2.5 : 5;
    const suggestedWeight = Math.round((lastWeight * 0.8) / roundTo) * roundTo;
    const suggestedReps = set?.reps ?? 0;

    await persistDropSegment(setId, nextIndex, suggestedWeight, suggestedReps);
    await hydrate(); // re-fetch to get the generated segment ID
  }, [state.dropsBySet, state.setsByChoice, unit, persistDropSegment, hydrate]);

  const handleCommitDropWeight = useCallback(async (setId: number, segmentId: number, raw: string) => {
    dispatch({ type: 'COMMIT_DROP_WEIGHT', setId, segmentId, raw });
    const weight = raw === '' ? 0 : (parseFloat(raw) || 0);
    const seg = state.dropsBySet[setId]?.find((d) => d.id === segmentId);
    if (seg) await persistUpdateDrop(segmentId, weight, seg.reps);
  }, [state.dropsBySet, dispatch, persistUpdateDrop]);

  const handleCommitDropReps = useCallback(async (setId: number, segmentId: number, raw: string) => {
    dispatch({ type: 'COMMIT_DROP_REPS', setId, segmentId, raw });
    const reps = raw === '' ? 0 : (parseInt(raw, 10) || 0);
    const seg = state.dropsBySet[setId]?.find((d) => d.id === segmentId);
    if (seg) await persistUpdateDrop(segmentId, seg.weight, reps);
  }, [state.dropsBySet, dispatch, persistUpdateDrop]);

  const handleDeleteDrop = useCallback(async (setId: number, segmentId: number) => {
    haptic('light');
    dispatch({ type: 'DELETE_DROP_SEGMENT', setId, segmentId });
    await persistDeleteDrop(segmentId);
  }, [dispatch, persistDeleteDrop]);

  const handleGenerateWarmups = useCallback(async (choiceId: number, workingWeight: number) => {
    await persistGenerateWarmups(choiceId, workingWeight, unit as 'kg' | 'lb');
    await hydrate();
  }, [unit, persistGenerateWarmups, hydrate]);

  const handleFinish = useCallback(() => {
    if (!state.draft) return;
    Alert.alert('Finish Session', 'Save and finalize this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          try {
            haptic('success');
            const sessionId = state.draft!.id;
            const currentElapsed = elapsed;
            await persistFinish(sessionId, rawNotes);
            dispatch({ type: 'RESET' });
            navigation.navigate('WorkoutSummary', { sessionId, duration: currentElapsed });
          } catch (err) {
            console.error('Error finishing session:', err);
            Alert.alert('Error', 'Failed to finish session: ' + (err as Error).message);
          }
        },
      },
    ]);
  }, [state.draft, elapsed, rawNotes, persistFinish, dispatch, navigation]);

  const handleDiscard = useCallback(() => {
    if (!state.draft) return;
    Alert.alert('Discard Workout', 'This will delete all progress for this session. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          try {
            haptic('error');
            await persistDiscard(state.draft!.id);
            dispatch({ type: 'RESET' });
          } catch (err) {
            console.error('Error discarding session:', err);
            Alert.alert('Error', 'Failed to discard session: ' + (err as Error).message);
          }
        },
      },
    ]);
  }, [state.draft, persistDiscard, dispatch]);

  const handleNotesBlur = useCallback(() => {
    if (state.draft) {
      dispatch({ type: 'SAVE_NOTES', text: rawNotes });
      persistNotes(state.draft.id, rawNotes);
    }
  }, [state.draft, rawNotes, dispatch, persistNotes]);

  const handleToggleExpand = useCallback((slotId: number) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }, []);

  const handleOpenPlateCalc = useCallback((weight: number) => {
    setPlateCalcWeight(weight);
    setPlateCalcVisible(true);
  }, []);

  /* ── Helpers ── */

  const setToChoiceMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const [choiceIdStr, sets] of Object.entries(state.setsByChoice)) {
      const choiceId = Number(choiceIdStr);
      for (const s of sets) map.set(s.id, choiceId);
    }
    return map;
  }, [state.setsByChoice]);

  function findChoiceIdForSet(setId: number): number | null {
    return setToChoiceMap.get(setId) ?? null;
  }

  function computeTimerContext(setId: number, choiceId: number): { nextSet?: NextSetInfo; nextExercise?: NextExerciseInfo; isLastSet?: boolean } {
    const currentSets = state.setsByChoice[choiceId] || [];
    const set = currentSets.find((s) => s.id === setId);
    if (!set) return {};

    const slot = state.slots.find((sl) => sl.selected_session_slot_choice_id === choiceId);
    if (!slot) return {};

    const nextSetInExercise = currentSets.find((x) => x.set_index > set.set_index && !x.completed);
    let nextSetInfo: NextSetInfo = null;
    let nextExInfo: NextExerciseInfo = null;
    let isLastSet = false;

    if (nextSetInExercise) {
      nextSetInfo = {
        exerciseName: slot.exercise_name || '',
        setNumber: nextSetInExercise.set_index,
        weight: nextSetInExercise.weight,
        reps: nextSetInExercise.reps,
        rpe: nextSetInExercise.rpe,
      };
    } else {
      isLastSet = true;
      const currentSlotIdx = state.slots.indexOf(slot);
      for (let i = currentSlotIdx + 1; i < state.slots.length; i++) {
        const ns = state.slots[i];
        const nChoiceId = ns.selected_session_slot_choice_id;
        if (!nChoiceId) continue;
        const nSets = state.setsByChoice[nChoiceId] || [];
        const firstIncompleteSet = nSets.find((x) => !x.completed);
        if (firstIncompleteSet) {
          nextExInfo = {
            exerciseName: ns.exercise_name || '',
            firstSetWeight: firstIncompleteSet.weight,
            firstSetReps: firstIncompleteSet.reps,
          };
          break;
        }
      }
    }

    return { nextSet: nextSetInfo, nextExercise: nextExInfo, isLastSet };
  }

  /* ── Render ── */

  if (state.phase === 'idle' || !state.draft) {
    return <IdleScreen onSessionStarted={hydrate} />;
  }

  if (state.slots.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: c.background }]}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={[styles.emptyTitle, { color: c.text }]}>Template has no exercises</Text>
        <Text style={[styles.emptyBody, { color: c.textSecondary }]}>
          Go to Templates, tap Edit, and add exercises to the slots before starting a workout.
        </Text>
        <Pressable
          style={styles.emptyDiscardBtn}
          onPress={async () => {
            await discardDraft(state.draft!.id);
            dispatch({ type: 'RESET' });
          }}
        >
          <Text style={styles.emptyDiscardBtnText}>End Session</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}>
      <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        {/* Summary header */}
        <SessionSummaryHeader
          elapsed={elapsed}
          completedSets={completedSets}
          totalSets={totalSets}
          totalVolume={totalVolume}
          unit={unit}
        />

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Pressable onPress={handleFinish} style={[styles.finishBtn, { backgroundColor: c.success }]}>
            <Text style={styles.finishBtnText}>✓ Finish</Text>
          </Pressable>
          <Pressable
            onPress={() => { setPlateCalcWeight(0); setPlateCalcVisible(true); }}
            style={[styles.discardBtn, { borderColor: c.border, backgroundColor: c.card }]}
          >
            <Text style={[styles.discardBtnText, { color: c.accent }]}>📐 Plates</Text>
          </Pressable>
          <Pressable onPress={handleDiscard} style={[styles.discardBtn, { backgroundColor: c.card, borderColor: c.danger }]}>
            <Text style={styles.discardBtnText}>✕ Discard</Text>
          </Pressable>
        </View>

        {/* Session Notes */}
        <Pressable
          onPress={() => setNotesExpanded(!notesExpanded)}
          style={[styles.notesToggle, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <Text style={[styles.notesToggleText, { color: c.textSecondary }]}>
            {notesExpanded ? '📝 Notes ▼' : `📝 Notes ${rawNotes ? '•' : ''}▶`}
          </Text>
        </Pressable>
        {notesExpanded && (
          <TextInput
            value={rawNotes}
            onChangeText={setRawNotes}
            onEndEditing={handleNotesBlur}
            placeholder="How's this workout going? Any notes..."
            placeholderTextColor={c.textTertiary}
            multiline
            style={[styles.notesInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
          />
        )}

        {/* Slot cards */}
        {state.slots.map((slot) => (
          <SlotCard
            key={slot.session_slot_id}
            slot={slot}
            options={state.optionsBySlot[slot.session_slot_id] || []}
            sets={state.setsByChoice[slot.selected_session_slot_choice_id!] || []}
            drops={state.dropsBySet}
            lastTime={state.lastTimeBySlot[slot.session_slot_id]}
            isExpanded={expandedSlots.has(slot.session_slot_id)}
            unit={unit}
            onToggleExpand={handleToggleExpand}
            onSelectChoice={handleSelectChoice}
            onToggleComplete={handleToggleComplete}
            onCommitWeight={handleCommitWeight}
            onCommitReps={handleCommitReps}
            onCycleRpe={handleCycleRpe}
            onDeleteSet={handleDeleteSet}
            onOpenPlateCalc={handleOpenPlateCalc}
            onAddDrop={handleAddDrop}
            onCommitDropWeight={handleCommitDropWeight}
            onCommitDropReps={handleCommitDropReps}
            onDeleteDrop={handleDeleteDrop}
            onGenerateWarmups={handleGenerateWarmups}
          />
        ))}

        {/* Rest Timer */}
        <RestTimerModal timer={timer} unit={unit} />

        {/* Plate Calculator */}
        <PlateCalculator
          visible={plateCalcVisible}
          onClose={() => setPlateCalcVisible(false)}
          weight={plateCalcWeight}
          unit={unit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
