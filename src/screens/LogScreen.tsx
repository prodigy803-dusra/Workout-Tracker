import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, TextInput, Modal, Animated as RNAnimated, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import { executeSqlAsync } from '../db/db';
import {
  finalizeSession,
  getActiveDraft,
  listDraftSlots,
  listSlotOptions,
  selectSlotChoice,
  discardDraft,
  createDraftFromTemplate,
} from '../db/repositories/sessionsRepo';
import {
  listSetsForChoice,
  toggleSetCompleted,
  upsertSet,
  lastTimeForOption,
  deleteSet,
  generateWarmupSets,
  addDropSegment,
  updateDropSegment,
  deleteDropSegment,
} from '../db/repositories/setsRepo';
import { listTemplates } from '../db/repositories/templatesRepo';
import { overallStats } from '../db/repositories/statsRepo';
import { detectAndRecordPRs } from '../db/repositories/statsRepo';
import OptionChips from '../components/OptionChips';
import PlateCalculator from '../components/PlateCalculator';
import { useRestTimer } from '../hooks/useRestTimer';
import type { NextSetInfo, NextExerciseInfo } from '../hooks/useRestTimer';
import { useUnit } from '../contexts/UnitContext';
import { useColors } from '../contexts/ThemeContext';
import { haptic } from '../utils/haptics';
import type { Session, DraftSlot, SlotOption, SetData, LastTimeData, OverallStats, Template } from '../types';

/* ═══════════════════════════════════════════════════════════
 *  Idle screen — shown when no workout is in progress
 * ═══════════════════════════════════════════════════════════ */
function IdleScreen({ onSessionStarted }: { onSessionStarted: () => void }) {
  const navigation = useNavigation<any>();
  const { unit } = useUnit();
  const c = useColors();
  const [templates, setTemplates] = useState<Pick<Template, 'id' | 'name'>[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [greeting, setGreeting] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useFocusEffect(
    useCallback(() => {
      listTemplates().then(setTemplates);
      overallStats().then(setStats);
    }, [])
  );

  const last7 = stats?.last7;
  const hasHistory = stats && stats.totalSessions > 0;

  async function quickStart(templateId: number) {
    if (starting) return;
    setStarting(true);
    try {
      await createDraftFromTemplate(templateId);
      onSessionStarted();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  }

  return (
    <ScrollView style={[idle.container, { backgroundColor: c.background }]} contentContainerStyle={idle.content}>
      {/* Greeting */}
      <View style={idle.hero}>
        <Text style={[idle.greeting, { color: c.textSecondary }]}>{greeting} 👋</Text>
        <Text style={[idle.heroTitle, { color: c.text }]}>Ready to train?</Text>
      </View>

      {/* Quick-start templates */}
      {templates.length > 0 && (
        <View style={idle.section}>
          <Text style={[idle.sectionTitle, { color: c.textSecondary }]}>QUICK START</Text>
          <View style={idle.templateGrid}>
            {templates.slice(0, 6).map((t) => (
              <Pressable
                key={t.id}
                style={[idle.templateCard, { backgroundColor: c.card, borderColor: c.border }, starting && { opacity: 0.5 }]}
                onPress={() => quickStart(t.id)}
                disabled={starting}
              >
                <Text style={idle.templateIcon}>🏋️</Text>
                <Text style={[idle.templateName, { color: c.text }]} numberOfLines={2}>
                  {t.name}
                </Text>
                <Text style={[idle.templateAction, { color: c.accent }]}>{starting ? 'Starting…' : 'Start →'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Weekly stats summary */}
      {hasHistory && last7 && (
        <View style={idle.section}>
          <Text style={[idle.sectionTitle, { color: c.textSecondary }]}>THIS WEEK</Text>
          <View style={idle.statsRow}>
            <View style={[idle.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[idle.statNumber, { color: c.text }]}>{last7.sessionsCount}</Text>
              <Text style={[idle.statLabel, { color: c.textSecondary }]}>Workouts</Text>
            </View>
            <View style={[idle.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[idle.statNumber, { color: c.text }]}>{last7.setsCount}</Text>
              <Text style={[idle.statLabel, { color: c.textSecondary }]}>Sets</Text>
            </View>
            <View style={[idle.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[idle.statNumber, { color: c.text }]}>
                {last7.totalVolume >= 1000
                  ? `${(last7.totalVolume / 1000).toFixed(1)}k`
                  : last7.totalVolume}
              </Text>
              <Text style={[idle.statLabel, { color: c.textSecondary }]}>Vol ({unit})</Text>
            </View>
          </View>
        </View>
      )}

      {/* All-time stats */}
      {hasHistory && (
        <View style={idle.section}>
          <View style={[idle.allTimeCard, { backgroundColor: c.isDark ? '#222' : '#1A1A1A' }]}>
            <Text style={idle.allTimeNum}>{stats.totalSessions}</Text>
            <Text style={idle.allTimeLabel}>total workouts logged</Text>
          </View>
        </View>
      )}

      {/* Empty state for new users */}
      {templates.length === 0 && (
        <View style={idle.onboarding}>
          <Text style={idle.onboardingIcon}>📑</Text>
          <Text style={[idle.onboardingTitle, { color: c.text }]}>Create your first template</Text>
          <Text style={[idle.onboardingBody, { color: c.textSecondary }]}>
            Set up a workout template in the Templates tab, then come back here to start logging.
          </Text>
          <Pressable
            style={[idle.onboardingBtn, { backgroundColor: c.primary }]}
            onPress={() => navigation.navigate('Templates')}
          >
            <Text style={[idle.onboardingBtnText, { color: c.primaryText }]}>Go to Templates</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const idle = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  content: { padding: 20, paddingBottom: 40 },

  hero: { marginBottom: 28 },
  greeting: { fontSize: 16, color: '#888', marginBottom: 4 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 10,
  },

  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  templateCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '46%',
    borderWidth: 1,
    borderColor: '#E6E1DB',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  templateIcon: { fontSize: 22, marginBottom: 8 },
  templateName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  templateAction: { fontSize: 13, fontWeight: '600', color: '#4A90D9' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },

  allTimeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  allTimeNum: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  allTimeLabel: { fontSize: 15, color: '#AAA' },

  onboarding: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  onboardingIcon: { fontSize: 48, marginBottom: 12 },
  onboardingTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  onboardingBody: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  onboardingBtn: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  onboardingBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

/* ═══════════════════════════════════════════════════════════
 *  Main Log screen — active workout
 * ═══════════════════════════════════════════════════════════ */
export default function LogScreen() {
  const navigation = useNavigation<any>();
  const [draft, setDraft] = useState<Session | null>(null);
  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [optionsBySlot, setOptionsBySlot] = useState<Record<number, SlotOption[]>>({});
  const [setsByChoice, setSetsByChoice] = useState<Record<number, SetData[]>>({});
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());
  const [lastTimeBySlot, setLastTimeBySlot] = useState<Record<number, LastTimeData>>({});

  // Keep screen awake during an active workout
  useKeepAwake('active-workout', { isEnabled: draft !== null });

  // Prevent accidental back-navigation during an active workout
  useEffect(() => {
    if (!draft) return;
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      // Allow programmatic navigation (e.g. after Finish/Discard)
      if (e.data.action.type === 'RESET' || e.data.action.type === 'REPLACE') return;
      e.preventDefault();
      Alert.alert(
        'Leave workout?',
        'You have an active workout in progress. Are you sure you want to leave? Your workout will still be here when you come back.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsub;
  }, [navigation, draft]);
  // Background-safe rest timer (persists across navigation / backgrounding)
  const timer = useRestTimer();

  // Drop-set segments: set_id → array of { id, segment_index, weight, reps }
  const [dropsBySet, setDropsBySet] = useState<Record<number, Array<{ id: number; segment_index: number; weight: number; reps: number }>>>({});

  // Plate calculator state
  const [plateCalcVisible, setPlateCalcVisible] = useState(false);
  const [plateCalcWeight, setPlateCalcWeight] = useState(0);

  // Session notes
  const [sessionNotes, setSessionNotes] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Session elapsed time
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { unit } = useUnit();
  const c = useColors();

  const load = useCallback(async () => {
    const d = await getActiveDraft();
    if (!d) {
      setDraft(null);
      setSlots([]);
      setOptionsBySlot({});
      setSetsByChoice({});
      setLastTimeBySlot({});
      return;
    }

    setDraft(d);
    setSessionNotes(d.notes || '');
    const slotRows = await listDraftSlots(d.id);
    setSlots(slotRows);

    // Auto-expand first incomplete slot
    const optionsEntries = await Promise.all(
      slotRows.map(async (s) => [s.session_slot_id, await listSlotOptions(s.session_slot_id)] as const)
    );
    setOptionsBySlot(Object.fromEntries(optionsEntries));

    // Batch-load all sets for all choices in one query
    const choiceIds = slotRows
      .map((s) => s.selected_session_slot_choice_id)
      .filter((id): id is number => id != null);

    const setsMap: Record<number, SetData[]> = {};
    let firstIncomplete: number | null = null;

    if (choiceIds.length > 0) {
      const placeholders = choiceIds.map(() => '?').join(',');
      const allSetsRes = await executeSqlAsync(
        `SELECT * FROM sets WHERE session_slot_choice_id IN (${placeholders}) ORDER BY session_slot_choice_id, set_index;`,
        choiceIds
      );
      // Group by choice id
      for (const row of allSetsRes.rows._array) {
        const cid = row.session_slot_choice_id;
        if (!setsMap[cid]) setsMap[cid] = [];
        setsMap[cid].push({
          id: row.id,
          set_index: row.set_index,
          weight: row.weight,
          reps: row.reps,
          rpe: row.rpe,
          rest_seconds: row.rest_seconds,
          completed: !!row.completed,
        });
      }
      // Determine first incomplete slot
      for (const s of slotRows) {
        const choiceId = s.selected_session_slot_choice_id;
        if (!choiceId) continue;
        const mapped = setsMap[choiceId] || [];
        if (firstIncomplete === null && mapped.some((x) => !x.completed)) {
          firstIncomplete = s.session_slot_id;
        }
      }
    }
    setSetsByChoice(setsMap);

    // Batch-load drop-set segments for all sets in this session
    const allSetIds = Object.values(setsMap).flat().map(s => s.id);
    if (allSetIds.length > 0) {
      const setPlaceholders = allSetIds.map(() => '?').join(',');
      const dropsRes = await executeSqlAsync(
        `SELECT id, set_id, segment_index, weight, reps
         FROM drop_set_segments
         WHERE set_id IN (${setPlaceholders})
         ORDER BY set_id, segment_index;`,
        allSetIds
      ).catch(() => ({ rows: { _array: [] as any[] } }));
      const dropsMap: Record<number, Array<{ id: number; segment_index: number; weight: number; reps: number }>> = {};
      for (const row of dropsRes.rows._array) {
        if (!dropsMap[row.set_id]) dropsMap[row.set_id] = [];
        dropsMap[row.set_id].push(row);
      }
      setDropsBySet(dropsMap);
    } else {
      setDropsBySet({});
    }

    // Auto-expand first incomplete slot on initial load
    if (firstIncomplete !== null) {
      setExpandedSlots(new Set([firstIncomplete]));
    }

    // Load "last time" data for each slot (parallelized)
    const lastTimeEntries = await Promise.all(
      slotRows
        .filter((s): s is DraftSlot & { template_slot_option_id: number } => s.template_slot_option_id != null)
        .map(async (s) => [s.session_slot_id, await lastTimeForOption(s.template_slot_option_id)] as const)
    );
    setLastTimeBySlot(Object.fromEntries(lastTimeEntries));
  }, []);

  // Session elapsed timer
  useEffect(() => {
    if (!draft) {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      return;
    }
    const startTime = new Date(draft.created_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    elapsedRef.current = setInterval(tick, 1000);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [draft]);

  // Compute overall progress and volume
  const { totalSets, completedSets, totalVolume } = useMemo(() => {
    let total = 0;
    let completed = 0;
    let volume = 0;
    for (const sets of Object.values(setsByChoice)) {
      for (const s of sets) {
        total++;
        if (s.completed) {
          completed++;
          volume += (s.weight || 0) * (s.reps || 0);
          // Include drop-set segment volume
          const drops = dropsBySet[s.id] || [];
          for (const d of drops) {
            volume += (d.weight || 0) * (d.reps || 0);
          }
        }
      }
    }
    return { totalSets: total, completedSets: completed, totalVolume: volume };
  }, [setsByChoice, dropsBySet]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!draft) {
    return <IdleScreen onSessionStarted={load} />;
  }

  if (slots.length === 0) {
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
            await discardDraft(draft.id);
            await load();
          }}
        >
          <Text style={styles.emptyDiscardBtnText}>End Session</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Session summary header */}
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
                { width: `${(completedSets / totalSets) * 100}%` },
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => {
            Alert.alert('Finish Session', 'Save and finalize this workout?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Finish',
                onPress: async () => {
                  try {
                    haptic('success');
                    const sessionId = draft.id;
                    const currentElapsed = elapsed;
                    // Flush any unsaved session notes before finalizing
                    await executeSqlAsync(
                      `UPDATE sessions SET notes=? WHERE id=?;`,
                      [sessionNotes || null, sessionId]
                    ).catch(() => {});
                    await finalizeSession(sessionId);
                    await detectAndRecordPRs(sessionId);
                    await load();
                    navigation.navigate('WorkoutSummary', {
                      sessionId,
                      duration: currentElapsed,
                    });
                  } catch (err) {
                    console.error('Error finishing session:', err);
                    Alert.alert('Error', 'Failed to finish session: ' + (err as Error).message);
                  }
                },
              },
            ]);
          }}
          style={[styles.finishBtn, { backgroundColor: c.success }]}
        >
          <Text style={styles.finishBtnText}>✓ Finish</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setPlateCalcWeight(0);
            setPlateCalcVisible(true);
          }}
          style={[styles.discardBtn, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Text style={[styles.discardBtnText, { color: c.accent }]}>📐 Plates</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert('Discard Workout', 'This will delete all progress for this session. Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Discard',
                style: 'destructive',
                onPress: async () => {
                  try {
                    haptic('error');
                    await discardDraft(draft.id);
                    await load();
                  } catch (err) {
                    console.error('Error discarding session:', err);
                    Alert.alert('Error', 'Failed to discard session: ' + (err as Error).message);
                  }
                },
              },
            ]);
          }}
          style={[styles.discardBtn, { backgroundColor: c.card, borderColor: c.danger }]}
        >
          <Text style={styles.discardBtnText}>✕ Discard</Text>
        </Pressable>
      </View>

      {/* Session Notes */}
      <Pressable
        onPress={() => setNotesExpanded(!notesExpanded)}
        style={[styles.notesToggle, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <Text style={[styles.notesToggleText, { color: c.textSecondary }]}>
          {notesExpanded ? '📝 Notes ▼' : `📝 Notes ${sessionNotes ? '•' : ''}▶`}
        </Text>
      </Pressable>
      {notesExpanded && (
        <TextInput
          value={sessionNotes}
          onChangeText={setSessionNotes}
          onEndEditing={() => {
            if (draft) {
              executeSqlAsync(
                `UPDATE sessions SET notes=? WHERE id=?;`,
                [sessionNotes || null, draft.id]
              ).catch(() => {});
            }
          }}
          placeholder="How's this workout going? Any notes..."
          placeholderTextColor={c.textTertiary}
          multiline
          style={[styles.notesInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
        />
      )}

      {slots.map((slot) => {
        const options = optionsBySlot[slot.session_slot_id] || [];
        const selectedTemplateOptionId = slot.template_slot_option_id;
        const selectedChoiceId = slot.selected_session_slot_choice_id;
        if (!selectedChoiceId) return null;

        const isExpanded = expandedSlots.has(slot.session_slot_id);
        const sets = setsByChoice[selectedChoiceId] || [];
        const completedCount = sets.filter((s) => s.completed).length;

        return (
          <View key={slot.session_slot_id} style={[styles.slotCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Pressable
              onPress={() => {
                setExpandedSlots((prev) => {
                  const next = new Set(prev);
                  if (next.has(slot.session_slot_id)) {
                    next.delete(slot.session_slot_id);
                  } else {
                    next.add(slot.session_slot_id);
                  }
                  return next;
                });
              }}
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
                      style={styles.infoBtn}
                    >
                      <Text style={styles.infoBtnText}>?</Text>
                    </Pressable>
                  )}
                </View>
                {sets.length > 0 && (
                  <Text style={styles.progressText}>
                    {completedCount}/{sets.length} sets done
                  </Text>
                )}
              </View>
              <Text style={[styles.chevron, { color: c.textSecondary }]}>{isExpanded ? '▼' : '▶'}</Text>
            </Pressable>

            {isExpanded && (
              <View style={styles.slotContent}>
                <OptionChips
                  options={options}
                  selectedTemplateOptionId={selectedTemplateOptionId ?? 0}
                  onSelect={async (templateSlotOptionId) => {
                    await selectSlotChoice(slot.session_slot_id, templateSlotOptionId);
                    await load();
                  }}
                />

                {/* Progressive overload suggestion */}
                {(() => {
                  const lt = lastTimeBySlot[slot.session_slot_id];
                  if (!lt || lt.sets.length === 0) return null;
                  const allCompleted = lt.sets.every((s) => s.completed);
                  if (!allCompleted) return null;
                  const heaviest = lt.sets.reduce(
                    (max, s) => (s.weight > max.weight ? s : max),
                    lt.sets[0]
                  );
                  const increment = unit === 'lb' ? 5 : 2.5;
                  const suggestedWeight = heaviest.weight + increment;
                  return (
                    <View style={[styles.suggestionBanner, { backgroundColor: c.warningBg, borderColor: c.isDark ? '#665A00' : '#F5D76E' }]}>
                      <Text style={styles.suggestionIcon}>📈</Text>
                      <Text style={[styles.suggestionText, { color: c.warningText }]}>
                        You completed all sets last session — try {suggestedWeight} {unit} × {heaviest.reps}
                      </Text>
                    </View>
                  );
                })()}

                {/* Warm-up generator */}
                {sets.length > 0 && !sets.some((s) => s.completed) && (() => {
                  const heaviest = sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0]);
                  if (heaviest.weight <= 0) return null;
                  return (
                    <Pressable
                      onPress={async () => {
                        haptic('light');
                        await generateWarmupSets(selectedChoiceId, heaviest.weight, unit);
                        await load();
                      }}
                      style={[styles.warmupBtn, { borderColor: c.accent, backgroundColor: c.accentBg }]}
                    >
                      <Text style={[styles.warmupBtnText, { color: c.accent }]}>🔥 Generate Warm-Up Sets</Text>
                    </Pressable>
                  );
                })()}

                {sets.length === 0 ? (
                  <Text style={[styles.noSetsText, { color: c.textTertiary }]}>No prescribed sets. Add sets in the template editor.</Text>
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
                      <React.Fragment key={s.set_index}>
                      <Swipeable
                        key={s.set_index}
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
                              onPress={async () => {
                                haptic('error');
                                await deleteSet(selectedChoiceId, s.set_index);
                                await load();
                              }}
                              style={styles.swipeDelete}
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
                        <Pressable
                          style={styles.radio}
                          onPress={async () => {
                            if (!s.completed) {
                              // Mark as completed and start timer
                              haptic('medium');
                              await toggleSetCompleted(s.id, true);
                              const updatedSets = setsByChoice[selectedChoiceId].map((x) =>
                                x.id === s.id ? { ...x, completed: true } : x
                              );
                              setSetsByChoice((prev) => ({
                                ...prev,
                                [selectedChoiceId]: updatedSets,
                              }));

                              // Auto-expand next incomplete slot if this slot is fully done
                              if (updatedSets.every((x) => x.completed)) {
                                const currentIndex = slots.findIndex(
                                  (sl) => sl.session_slot_id === slot.session_slot_id
                                );
                                for (let i = currentIndex + 1; i < slots.length; i++) {
                                  const nextSlot = slots[i];
                                  const nextChoiceId = nextSlot.selected_session_slot_choice_id;
                                  if (!nextChoiceId) continue;
                                  const nextSets = setsByChoice[nextChoiceId] || [];
                                  if (nextSets.some((x: SetData) => !x.completed)) {
                                    setExpandedSlots((prev) => {
                                      const n = new Set(prev);
                                      n.delete(slot.session_slot_id);
                                      n.add(nextSlot.session_slot_id);
                                      return n;
                                    });
                                    break;
                                  }
                                }
                              }

                              if (s.rest_seconds && s.rest_seconds > 0) {
                                // Compute next-set context for the rest-timer preview
                                const currentSets = updatedSets;
                                const nextSetInExercise = currentSets.find(
                                  (x) => x.set_index > s.set_index && !x.completed
                                );
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
                                  const currentSlotIndex = slots.findIndex(
                                    (sl) => sl.session_slot_id === slot.session_slot_id
                                  );
                                  for (let i = currentSlotIndex + 1; i < slots.length; i++) {
                                    const ns = slots[i];
                                    const nChoiceId = ns.selected_session_slot_choice_id;
                                    if (!nChoiceId) continue;
                                    const nSets = setsByChoice[nChoiceId] || [];
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

                                timer.start(s.rest_seconds, {
                                  nextSet: nextSetInfo,
                                  nextExercise: nextExInfo,
                                  isLastSet,
                                });
                              }
                            } else {
                              // Unmark completion
                              await toggleSetCompleted(s.id, false);
                              setSetsByChoice((prev) => ({
                                ...prev,
                                [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                  x.id === s.id ? { ...x, completed: false } : x
                                ),
                              }));
                            }
                          }}
                        >
                          {s.completed && <View style={styles.radioFill} />}
                        </Pressable>
                        <Text style={[styles.setIndex, { color: c.textSecondary }, s.completed && styles.completedText]}>#{s.set_index}</Text>
                        <TextInput
                          value={String(s.weight)}
                          onChangeText={(text) => {
                            const weight = text === '' ? 0 : (parseFloat(text) || 0);
                            setSetsByChoice((prev) => ({
                              ...prev,
                              [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                x.id === s.id ? { ...x, weight } : x
                              ),
                            }));
                          }}
                          onEndEditing={() => {
                            const currentSet = setsByChoice[selectedChoiceId]?.find((x) => x.id === s.id);
                            if (currentSet) {
                              upsertSet(selectedChoiceId, currentSet.set_index, currentSet.weight, currentSet.reps, currentSet.rpe, null, currentSet.rest_seconds).catch(() => {});
                            }
                          }}
                          onSubmitEditing={() => {
                            const w = setsByChoice[selectedChoiceId]?.find((x) => x.id === s.id)?.weight ?? 0;
                            if (w > 0) {
                              setPlateCalcWeight(w);
                              setPlateCalcVisible(true);
                            }
                          }}
                          keyboardType="numeric"
                          placeholderTextColor={c.textTertiary}
                          style={[styles.setInput, { flex: 1, color: c.text, backgroundColor: c.inputBg, borderColor: c.border }, s.completed && { color: c.textTertiary, backgroundColor: c.completedBg, borderColor: c.completedBorder }]}
                        />
                        <TextInput
                          value={String(s.reps)}
                          onChangeText={(text) => {
                            const reps = text === '' ? 0 : (parseInt(text, 10) || 0);
                            setSetsByChoice((prev) => ({
                              ...prev,
                              [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                x.id === s.id ? { ...x, reps } : x
                              ),
                            }));
                          }}
                          onEndEditing={() => {
                            const currentSet = setsByChoice[selectedChoiceId]?.find((x) => x.id === s.id);
                            if (currentSet) {
                              upsertSet(selectedChoiceId, currentSet.set_index, currentSet.weight, currentSet.reps, currentSet.rpe, null, currentSet.rest_seconds).catch(() => {});
                            }
                          }}
                          keyboardType="number-pad"
                          placeholderTextColor={c.textTertiary}
                          style={[styles.setInput, { width: 64, color: c.text, backgroundColor: c.inputBg, borderColor: c.border }, s.completed && { color: c.textTertiary, backgroundColor: c.completedBg, borderColor: c.completedBorder }]}
                        />
                        <Pressable
                          onPress={() => {
                            haptic('selection');
                            // Cycle RPE: null → 6 → 7 → 8 → 9 → 10 → null
                            const rpeOrder = [null, 6, 7, 8, 9, 10];
                            const currentIdx = rpeOrder.indexOf(s.rpe);
                            const nextRpe = rpeOrder[(currentIdx + 1) % rpeOrder.length];
                            setSetsByChoice((prev) => ({
                              ...prev,
                              [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                x.id === s.id ? { ...x, rpe: nextRpe } : x
                              ),
                            }));
                            const currentSet = setsByChoice[selectedChoiceId]?.find((x) => x.id === s.id);
                            if (currentSet) {
                              upsertSet(selectedChoiceId, currentSet.set_index, currentSet.weight, currentSet.reps, nextRpe, null, currentSet.rest_seconds).catch(() => {});
                            }
                          }}
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
                      {(dropsBySet[s.id] || []).map((seg) => (
                        <View key={`drop-${seg.id}`} style={[styles.dropSegmentRow, { borderBottomColor: c.border }]}>
                          <Text style={[styles.dropArrow, { color: c.textTertiary }]}>↳</Text>
                          <TextInput
                            value={String(seg.weight || '')}
                            onChangeText={(text) => {
                              const weight = text === '' ? 0 : (parseFloat(text) || 0);
                              setDropsBySet((prev) => ({
                                ...prev,
                                [s.id]: (prev[s.id] || []).map((d) =>
                                  d.id === seg.id ? { ...d, weight } : d
                                ),
                              }));
                            }}
                            onEndEditing={() => {
                              const current = dropsBySet[s.id]?.find((d) => d.id === seg.id);
                              if (current) {
                                updateDropSegment(current.id, current.weight, current.reps).catch(() => {});
                              }
                            }}
                            keyboardType="numeric"
                            placeholder="Wt"
                            placeholderTextColor={c.textTertiary}
                            style={[styles.dropInput, { color: c.text, backgroundColor: c.inputBg, borderColor: c.border }]}
                          />
                          <Text style={[styles.dropX, { color: c.textTertiary }]}>×</Text>
                          <TextInput
                            value={String(seg.reps || '')}
                            onChangeText={(text) => {
                              const reps = text === '' ? 0 : (parseInt(text, 10) || 0);
                              setDropsBySet((prev) => ({
                                ...prev,
                                [s.id]: (prev[s.id] || []).map((d) =>
                                  d.id === seg.id ? { ...d, reps } : d
                                ),
                              }));
                            }}
                            onEndEditing={() => {
                              const current = dropsBySet[s.id]?.find((d) => d.id === seg.id);
                              if (current) {
                                updateDropSegment(current.id, current.weight, current.reps).catch(() => {});
                              }
                            }}
                            keyboardType="number-pad"
                            placeholder="Reps"
                            placeholderTextColor={c.textTertiary}
                            style={[styles.dropInput, { width: 52, color: c.text, backgroundColor: c.inputBg, borderColor: c.border }]}
                          />
                          <Pressable
                            hitSlop={8}
                            onPress={async () => {
                              haptic('light');
                              await deleteDropSegment(seg.id);
                              setDropsBySet((prev) => ({
                                ...prev,
                                [s.id]: (prev[s.id] || []).filter((d) => d.id !== seg.id),
                              }));
                            }}
                          >
                            <Text style={[styles.dropDeleteBtn, { color: c.danger }]}>✕</Text>
                          </Pressable>
                        </View>
                      ))}

                      {/* Add drop-set button (shown for sets with weight) */}
                      {s.weight > 0 && (
                        <Pressable
                          onPress={async () => {
                            haptic('selection');
                            const existingDrops = dropsBySet[s.id] || [];
                            const nextIndex = existingDrops.length > 0
                              ? Math.max(...existingDrops.map((d) => d.segment_index)) + 1
                              : 1;
                            // Pre-fill with ~80% of previous weight
                            const lastWeight = existingDrops.length > 0
                              ? existingDrops[existingDrops.length - 1].weight
                              : s.weight;
                            const roundTo = unit === 'kg' ? 2.5 : 5;
                            const suggestedWeight = Math.round((lastWeight * 0.8) / roundTo) * roundTo;
                            await addDropSegment(s.id, nextIndex, suggestedWeight, s.reps);
                            await load();
                          }}
                          style={styles.addDropBtn}
                        >
                          <Text style={[styles.addDropBtnText, { color: c.accent }]}>
                            ↓ Drop Set
                          </Text>
                        </Pressable>
                      )}
                      </React.Fragment>
                    ))}
                  </>
                )}

                {/* Last Time panel */}
                {lastTimeBySlot[slot.session_slot_id] && (
                  <View style={[styles.lastTimeContainer, { backgroundColor: c.sectionHeaderBg, borderColor: c.border }]}>
                    <Text style={[styles.lastTimeTitle, { color: c.textSecondary }]}>
                      Last time — {new Date(lastTimeBySlot[slot.session_slot_id]!.performed_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.lastTimeSets}>
                      {lastTimeBySlot[slot.session_slot_id]!.sets.map((ls, i: number) => (
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
      })}

      {/* Cooldown Timer Modal — background-safe, shows next-set preview */}
      <Modal visible={timer.isVisible} transparent animationType="fade">
        <Pressable 
          style={styles.timerBackdrop}
          onPress={() => timer.hide()}
        >
          <View style={[styles.timerModal, { backgroundColor: c.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.timerTitle, { color: c.text }]}>
              {timer.remaining <= 0 && !timer.isRunning ? '✅ Rest Complete!' : 'Rest Timer'}
            </Text>
            <Text style={[styles.timerDisplay, {
              color: timer.remaining <= 0 ? c.success
                : timer.remaining <= 5 ? c.danger
                : c.success,
            }]}>
              {Math.floor(timer.remaining / 60)}:{(timer.remaining % 60).toString().padStart(2, '0')}
            </Text>

            {/* Progress bar */}
            {timer.totalDuration > 0 && (
              <View style={[styles.timerProgressBg, { backgroundColor: c.isDark ? '#333' : '#E8E8E8' }]}>
                <View
                  style={[
                    styles.timerProgressFill,
                    {
                      width: `${Math.min(100, Math.max(0, (1 - timer.remaining / timer.totalDuration)) * 100)}%`,
                      backgroundColor: timer.remaining <= 5 ? c.danger : c.success,
                    },
                  ]}
                />
              </View>
            )}

            {/* Next set / next exercise preview */}
            {(timer.nextSet || (timer.isLastSetOfExercise && timer.nextExercise)) && (
              <View style={[styles.nextSetPreview, { backgroundColor: c.sectionHeaderBg, borderColor: c.border }]}>
                {timer.isLastSetOfExercise && timer.nextExercise ? (
                  <>
                    <Text style={[styles.nextSetLabel, { color: c.textSecondary }]}>UP NEXT</Text>
                    <Text style={[styles.nextSetExercise, { color: c.text }]}>
                      🏋️ {timer.nextExercise.exerciseName}
                    </Text>
                    {timer.nextExercise.firstSetWeight != null && (
                      <Text style={[styles.nextSetDetail, { color: c.textSecondary }]}>
                        Set #1: {timer.nextExercise.firstSetWeight} {unit} × {timer.nextExercise.firstSetReps}
                      </Text>
                    )}
                  </>
                ) : timer.nextSet ? (
                  <>
                    <Text style={[styles.nextSetLabel, { color: c.textSecondary }]}>COMING UP</Text>
                    <Text style={[styles.nextSetExercise, { color: c.text }]}>
                      {timer.nextSet.exerciseName}
                    </Text>
                    <Text style={[styles.nextSetDetail, { color: c.textSecondary }]}>
                      Set #{timer.nextSet.setNumber}: {timer.nextSet.weight} {unit} × {timer.nextSet.reps}
                      {timer.nextSet.rpe ? ` @${timer.nextSet.rpe}` : ''}
                    </Text>
                  </>
                ) : null}
              </View>
            )}

            {timer.remaining > 0 ? (
              <View style={styles.timerControls}>
                <Pressable
                  style={[styles.timerBtn, { backgroundColor: c.inputBg }]}
                  onPress={() => timer.addTime(-5)}
                >
                  <Text style={[styles.timerBtnText, { color: c.text }]}>-5s</Text>
                </Pressable>
                <Pressable
                  style={[styles.timerBtn, { backgroundColor: c.success }]}
                  onPress={() => (timer.isRunning ? timer.pause() : timer.resume())}
                >
                  <Text style={[styles.timerBtnText, { color: '#FFF' }]}>
                    {timer.isRunning ? 'Pause' : 'Resume'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.timerBtn, { backgroundColor: c.inputBg }]}
                  onPress={() => timer.addTime(5)}
                >
                  <Text style={[styles.timerBtnText, { color: c.text }]}>+5s</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.timerBtn, { backgroundColor: c.success, paddingHorizontal: 40, marginBottom: 12 }]}
                onPress={() => timer.skip()}
              >
                <Text style={[styles.timerBtnText, { color: '#FFF' }]}>Let's Go! 💪</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.timerSkipBtn}
              onPress={() => timer.skip()}
            >
              <Text style={[styles.timerSkipText, { color: c.textSecondary }]}>
                {timer.remaining > 0 ? 'Skip Rest' : 'Dismiss'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F4F1' },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', fontVariant: ['tabular-nums'] },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#1A7F37',
    borderRadius: 3,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F6F4F1',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  emptyBody: { fontSize: 14, color: '#888', marginTop: 6, textAlign: 'center' },
  emptyDiscardBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyDiscardBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  discardBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  discardBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  finishBtn: {
    backgroundColor: '#1A7F37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flex: 2,
  },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  slotCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6E1DB',
    overflow: 'hidden',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  slotHeaderContent: { flex: 1 },
  slotTitleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  slotTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  infoBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E6E1DB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  infoBtnText: { fontSize: 13, fontWeight: '700', color: '#555' },
  slotSubtitle: { fontSize: 13, color: '#888', marginBottom: 4 },
  chevron: { fontSize: 16, color: '#888', marginLeft: 12 },
  slotContent: { padding: 14 },
  noSetsText: { fontSize: 14, color: '#999', marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
  progressText: { fontSize: 12, color: '#1A7F37', marginTop: 4, fontWeight: '600' },
  setsHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  colLabel: { fontSize: 11, color: '#AAA', fontWeight: '600', width: 28 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  setRowCompleted: {
    backgroundColor: '#F0FFF4',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1A7F37',
  },
  setIndex: { width: 28, fontSize: 13, color: '#888', fontWeight: '600' },
  setValue: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  setInput: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'center',
  },
  completedInput: {
    color: '#999',
    backgroundColor: '#F0FFF4',
    borderColor: '#D0E8D6',
  },
  completedText: { color: '#999', textDecorationLine: 'line-through' },

  // Last time panel
  lastTimeContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F6F4F1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  lastTimeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 4,
  },
  lastTimeSets: { gap: 2 },
  lastTimeSet: { fontSize: 13, color: '#666' },

  // Progressive overload suggestion
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBE6',
    borderWidth: 1,
    borderColor: '#F5D76E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  suggestionIcon: { fontSize: 16 },
  suggestionText: { fontSize: 13, color: '#7A6B00', flex: 1 },

  // Warm-up generator
  warmupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 6,
  },
  warmupBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // RPE chip
  rpeChip: {
    width: 52,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Session notes
  notesToggle: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  notesToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    height: 80,
    marginBottom: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  
  // Timer Modal Styles
  timerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    width: 320,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '700',
    color: '#1A7F37',
    marginBottom: 24,
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timerBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timerBtnPrimary: {
    backgroundColor: '#1A7F37',
  },
  timerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timerBtnTextPrimary: {
    color: '#FFF',
  },
  timerSkipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  timerSkipText: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'underline',
  },

  // Timer progress bar
  timerProgressBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 20,
    overflow: 'hidden' as const,
  },
  timerProgressFill: {
    height: 6,
    borderRadius: 3,
  },

  // Next-set preview in timer modal
  nextSetPreview: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  nextSetLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextSetExercise: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  nextSetDetail: {
    fontSize: 14,
  },

  // Drop-set segments
  dropSegmentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingLeft: 36,
    borderBottomWidth: 1,
  },
  dropArrow: {
    fontSize: 16,
    marginRight: 2,
  },
  dropInput: {
    fontSize: 14,
    fontWeight: '500' as const,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    textAlign: 'center' as const,
    width: 64,
  },
  dropX: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dropDeleteBtn: {
    fontSize: 14,
    fontWeight: '700' as const,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  addDropBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingLeft: 36,
  },
  addDropBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },

  // Swipe to delete
  swipeDelete: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 0,
  },
  swipeDeleteText: {
    fontSize: 20,
  },
});
