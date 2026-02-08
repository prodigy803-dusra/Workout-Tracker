import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
} from '../db/repositories/setsRepo';
import { listTemplates } from '../db/repositories/templatesRepo';
import { overallStats } from '../db/repositories/statsRepo';
import OptionChips from '../components/OptionChips';
import { useUnit } from '../contexts/UnitContext';

type SetData = {
  id: number;
  set_index: number;
  weight: number;
  reps: number;
  rpe: number | null;
  rest_seconds: number | null;
  completed: boolean;
};

type LastTimeData = {
  performed_at: string;
  sets: any[];
} | null;

/* ═══════════════════════════════════════════════════════════
 *  Idle screen — shown when no workout is in progress
 * ═══════════════════════════════════════════════════════════ */
function IdleScreen({ onSessionStarted }: { onSessionStarted: () => void }) {
  const navigation = useNavigation<any>();
  const { unit } = useUnit();
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [greeting, setGreeting] = useState('');

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
    try {
      await createDraftFromTemplate(templateId);
      onSessionStarted();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start session');
    }
  }

  return (
    <ScrollView style={idle.container} contentContainerStyle={idle.content}>
      {/* Greeting */}
      <View style={idle.hero}>
        <Text style={idle.greeting}>{greeting} 👋</Text>
        <Text style={idle.heroTitle}>Ready to train?</Text>
      </View>

      {/* Quick-start templates */}
      {templates.length > 0 && (
        <View style={idle.section}>
          <Text style={idle.sectionTitle}>QUICK START</Text>
          <View style={idle.templateGrid}>
            {templates.slice(0, 6).map((t) => (
              <Pressable
                key={t.id}
                style={idle.templateCard}
                onPress={() => quickStart(t.id)}
              >
                <Text style={idle.templateIcon}>🏋️</Text>
                <Text style={idle.templateName} numberOfLines={2}>
                  {t.name}
                </Text>
                <Text style={idle.templateAction}>Start →</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Weekly stats summary */}
      {hasHistory && last7 && (
        <View style={idle.section}>
          <Text style={idle.sectionTitle}>THIS WEEK</Text>
          <View style={idle.statsRow}>
            <View style={idle.statCard}>
              <Text style={idle.statNumber}>{last7.sessionsCount}</Text>
              <Text style={idle.statLabel}>Workouts</Text>
            </View>
            <View style={idle.statCard}>
              <Text style={idle.statNumber}>{last7.setsCount}</Text>
              <Text style={idle.statLabel}>Sets</Text>
            </View>
            <View style={idle.statCard}>
              <Text style={idle.statNumber}>
                {last7.totalVolume >= 1000
                  ? `${(last7.totalVolume / 1000).toFixed(1)}k`
                  : last7.totalVolume}
              </Text>
              <Text style={idle.statLabel}>Vol ({unit})</Text>
            </View>
          </View>
        </View>
      )}

      {/* All-time stats */}
      {hasHistory && (
        <View style={idle.section}>
          <View style={idle.allTimeCard}>
            <Text style={idle.allTimeNum}>{stats.totalSessions}</Text>
            <Text style={idle.allTimeLabel}>total workouts logged</Text>
          </View>
        </View>
      )}

      {/* Empty state for new users */}
      {templates.length === 0 && (
        <View style={idle.onboarding}>
          <Text style={idle.onboardingIcon}>📑</Text>
          <Text style={idle.onboardingTitle}>Create your first template</Text>
          <Text style={idle.onboardingBody}>
            Set up a workout template in the Templates tab, then come back here to start logging.
          </Text>
          <Pressable
            style={idle.onboardingBtn}
            onPress={() => navigation.navigate('Templates')}
          >
            <Text style={idle.onboardingBtnText}>Go to Templates</Text>
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
  const [draft, setDraft] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [optionsBySlot, setOptionsBySlot] = useState<Record<number, any[]>>({});
  const [setsByChoice, setSetsByChoice] = useState<Record<number, SetData[]>>({});
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());
  const [lastTimeBySlot, setLastTimeBySlot] = useState<Record<number, LastTimeData>>({});

  // Timer modal state
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Session elapsed time
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { unit } = useUnit();

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
    const slotRows = await listDraftSlots(d.id);
    setSlots(slotRows);

    // Auto-expand first incomplete slot
    const optionsEntries = await Promise.all(
      slotRows.map(async (s) => [s.session_slot_id, await listSlotOptions(s.session_slot_id)] as const)
    );
    setOptionsBySlot(Object.fromEntries(optionsEntries));

    const setsMap: Record<number, SetData[]> = {};
    let firstIncomplete: number | null = null;
    for (const s of slotRows) {
      const choiceId = s.selected_session_slot_choice_id;
      if (!choiceId) continue;
      const setRows = await listSetsForChoice(choiceId);
      const mapped = setRows.map((row: any) => ({
        id: row.id,
        set_index: row.set_index,
        weight: row.weight,
        reps: row.reps,
        rpe: row.rpe,
        rest_seconds: row.rest_seconds,
        completed: !!row.completed,
      }));
      setsMap[choiceId] = mapped;
      if (firstIncomplete === null && mapped.some((x) => !x.completed)) {
        firstIncomplete = s.session_slot_id;
      }
    }
    setSetsByChoice(setsMap);

    // Auto-expand first incomplete slot on initial load
    if (firstIncomplete !== null) {
      setExpandedSlots(new Set([firstIncomplete]));
    }

    // Load "last time" data for each slot (parallelized)
    const lastTimeEntries = await Promise.all(
      slotRows
        .filter((s) => s.template_slot_option_id)
        .map(async (s) => [s.session_slot_id, await lastTimeForOption(s.template_slot_option_id)] as const)
    );
    setLastTimeBySlot(Object.fromEntries(lastTimeEntries));
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setTimerVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

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
        }
      }
    }
    return { totalSets: total, completedSets: completed, totalVolume: volume };
  }, [setsByChoice]);

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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyTitle}>Template has no exercises</Text>
        <Text style={styles.emptyBody}>
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Session summary header */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatElapsed(elapsed)}</Text>
            <Text style={styles.summaryLabel}>Duration</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completedSets}/{totalSets}</Text>
            <Text style={styles.summaryLabel}>Sets</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            </Text>
            <Text style={styles.summaryLabel}>Volume ({unit})</Text>
          </View>
        </View>
        {totalSets > 0 && (
          <View style={styles.progressBarBg}>
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
                    await finalizeSession(draft.id);
                    await load();
                  } catch (err) {
                    console.error('Error finishing session:', err);
                    Alert.alert('Error', 'Failed to finish session: ' + (err as Error).message);
                  }
                },
              },
            ]);
          }}
          style={styles.finishBtn}
        >
          <Text style={styles.finishBtnText}>✓ Finish</Text>
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
          style={styles.discardBtn}
        >
          <Text style={styles.discardBtnText}>✕ Discard</Text>
        </Pressable>
      </View>

      {slots.map((slot) => {
        const options = optionsBySlot[slot.session_slot_id] || [];
        const selectedTemplateOptionId = slot.template_slot_option_id;
        const selectedChoiceId = slot.selected_session_slot_choice_id;
        if (!selectedChoiceId) return null;

        const isExpanded = expandedSlots.has(slot.session_slot_id);
        const sets = setsByChoice[selectedChoiceId] || [];
        const completedCount = sets.filter((s) => s.completed).length;

        return (
          <View key={slot.session_slot_id} style={styles.slotCard}>
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
              style={styles.slotHeader}
            >
              <View style={styles.slotHeaderContent}>
                {slot.name && <Text style={styles.slotSubtitle}>{slot.name}</Text>}
                <View style={styles.slotTitleRow}>
                  <Text style={styles.slotTitle}>
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
              <Text style={styles.chevron}>{isExpanded ? '▼' : '▶'}</Text>
            </Pressable>

            {isExpanded && (
              <View style={styles.slotContent}>
                <OptionChips
                  options={options}
                  selectedTemplateOptionId={selectedTemplateOptionId}
                  onSelect={async (templateSlotOptionId) => {
                    await selectSlotChoice(slot.session_slot_id, templateSlotOptionId);
                    await load();
                  }}
                />

                {sets.length === 0 ? (
                  <Text style={styles.noSetsText}>No prescribed sets. Add sets in the template editor.</Text>
                ) : (
                  <>
                    <View style={styles.setsHeader}>
                      <Text style={[styles.colLabel, { width: 36 }]} />
                      <Text style={styles.colLabel}>#</Text>
                      <Text style={[styles.colLabel, { flex: 1 }]}>Weight ({unit})</Text>
                      <Text style={[styles.colLabel, { width: 64 }]}>Reps</Text>
                      <Text style={[styles.colLabel, { width: 52 }]}>RPE</Text>
                    </View>

                    {sets.map((s) => (
                      <View
                        key={s.set_index}
                        style={[
                          styles.setRow,
                          s.completed && styles.setRowCompleted,
                        ]}
                      >
                        <Pressable
                          style={styles.radio}
                          onPress={async () => {
                            if (!s.completed) {
                              // Mark as completed and start timer
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
                                  const nextSets = setsByChoice[nextChoiceId] || [];
                                  if (nextSets.some((x) => !x.completed)) {
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
                                setTimerSeconds(s.rest_seconds);
                                setTimerRunning(true);
                                setTimerVisible(true);
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
                        <Text style={[styles.setIndex, s.completed && styles.completedText]}>#{s.set_index}</Text>
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
                          keyboardType="numeric"
                          style={[styles.setInput, { flex: 1 }, s.completed && styles.completedInput]}
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
                          style={[styles.setInput, { width: 64 }, s.completed && styles.completedInput]}
                        />
                        <TextInput
                          value={s.rpe != null ? String(s.rpe) : ''}
                          onChangeText={(text) => {
                            const rpe = text ? parseFloat(text) : null;
                            setSetsByChoice((prev) => ({
                              ...prev,
                              [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                x.id === s.id ? { ...x, rpe } : x
                              ),
                            }));
                          }}
                          onEndEditing={() => {
                            const currentSet = setsByChoice[selectedChoiceId]?.find((x) => x.id === s.id);
                            if (currentSet) {
                              upsertSet(selectedChoiceId, currentSet.set_index, currentSet.weight, currentSet.reps, currentSet.rpe, null, currentSet.rest_seconds).catch(() => {});
                            }
                          }}
                          keyboardType="decimal-pad"
                          placeholder="RPE"
                          style={[styles.setInput, { width: 52 }, s.completed && styles.completedInput]}
                        />
                      </View>
                    ))}
                  </>
                )}

                {/* Last Time panel */}
                {lastTimeBySlot[slot.session_slot_id] && (
                  <View style={styles.lastTimeContainer}>
                    <Text style={styles.lastTimeTitle}>
                      Last time — {new Date(lastTimeBySlot[slot.session_slot_id]!.performed_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.lastTimeSets}>
                      {lastTimeBySlot[slot.session_slot_id]!.sets.map((ls: any, i: number) => (
                        <Text key={i} style={styles.lastTimeSet}>
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

      {/* Cooldown Timer Modal */}
      <Modal visible={timerVisible} transparent animationType="fade">
        <Pressable 
          style={styles.timerBackdrop}
          onPress={() => {
            setTimerVisible(false);
            setTimerRunning(false);
          }}
        >
          <View style={styles.timerModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.timerTitle}>Rest Timer</Text>
            <Text style={styles.timerDisplay}>
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </Text>
            <View style={styles.timerControls}>
              <Pressable
                style={styles.timerBtn}
                onPress={() => setTimerSeconds((prev) => Math.max(0, prev - 5))}
              >
                <Text style={styles.timerBtnText}>-5s</Text>
              </Pressable>
              <Pressable
                style={[styles.timerBtn, styles.timerBtnPrimary]}
                onPress={() => {
                  setTimerRunning(!timerRunning);
                }}
              >
                <Text style={[styles.timerBtnText, styles.timerBtnTextPrimary]}>
                  {timerRunning ? 'Pause' : 'Start'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.timerBtn}
                onPress={() => setTimerSeconds((prev) => prev + 5)}
              >
                <Text style={styles.timerBtnText}>+5s</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.timerSkipBtn}
              onPress={() => {
                setTimerVisible(false);
                setTimerRunning(false);
              }}
            >
              <Text style={styles.timerSkipText}>Skip Rest</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
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
});
