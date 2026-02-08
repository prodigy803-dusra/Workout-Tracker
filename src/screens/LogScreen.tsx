import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  finalizeSession,
  getActiveDraft,
  listDraftSlots,
  listSlotOptions,
  selectSlotChoice,
  discardDraft,
} from '../db/repositories/sessionsRepo';
import {
  listSetsForChoice,
  toggleSetCompleted,
  upsertSet,
} from '../db/repositories/setsRepo';
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

export default function LogScreen() {
  const [draft, setDraft] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [optionsBySlot, setOptionsBySlot] = useState<Record<number, any[]>>({});
  const [setsByChoice, setSetsByChoice] = useState<Record<number, SetData[]>>({});
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());
  
  // Timer modal state
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  
  const { unit } = useUnit();

  const load = useCallback(async () => {
    const d = await getActiveDraft();
    if (!d) {
      setDraft(null);
      setSlots([]);
      setOptionsBySlot({});
      setSetsByChoice({});
      return;
    }

    setDraft(d);
    const slotRows = await listDraftSlots(d.id);
    setSlots(slotRows);

    const optionsEntries = await Promise.all(
      slotRows.map(async (s) => [s.session_slot_id, await listSlotOptions(s.session_slot_id)] as const)
    );
    setOptionsBySlot(Object.fromEntries(optionsEntries));

    const setsMap: Record<number, SetData[]> = {};
    for (const s of slotRows) {
      const choiceId = s.selected_session_slot_choice_id;
      if (!choiceId) continue;
      const setRows = await listSetsForChoice(choiceId);
      setsMap[choiceId] = setRows.map((row: any) => ({
        id: row.id,
        set_index: row.set_index,
        weight: row.weight,
        reps: row.reps,
        rpe: row.rpe,
        rest_seconds: row.rest_seconds,
        completed: !!row.completed,
      }));
    }
    setSetsByChoice(setsMap);
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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!draft) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏋️</Text>
        <Text style={styles.emptyTitle}>No Active Session</Text>
        <Text style={styles.emptyBody}>Go to Templates and tap Start to begin logging.</Text>
      </View>
    );
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
          style={styles.discardBtn}
          onPress={async () => {
            await discardDraft(draft.id);
            await load();
          }}
        >
          <Text style={styles.discardBtnText}>End Session</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable
        onPress={() => {
          Alert.alert('Finish Session', 'Save and finalize this workout?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Finish',
              onPress: async () => {
                await finalizeSession(draft.id);
                await load();
              },
            },
          ]);
        }}
        style={styles.finishBtn}
      >
        <Text style={styles.finishBtnText}>✓ Finish Session</Text>
      </Pressable>

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
                <Text style={styles.slotTitle}>
                  {slot.exercise_name}
                  {slot.option_name ? ` (${slot.option_name})` : ''}
                </Text>
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
                      <Text style={[styles.colLabel, { flex: 1 }]}>Weight</Text>
                      <Text style={[styles.colLabel, { width: 64 }]}>Reps</Text>
                      <Text style={[styles.colLabel, { width: 52 }]}>RPE</Text>
                      <Text style={[styles.colLabel, { width: 36 }]} />
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
                              setSetsByChoice((prev) => ({
                                ...prev,
                                [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                  x.id === s.id ? { ...x, completed: true } : x
                                ),
                              }));
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
                            const weight = parseFloat(text) || 0;
                            setSetsByChoice((prev) => ({
                              ...prev,
                              [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                x.id === s.id ? { ...x, weight } : x
                              ),
                            }));
                          }}
                          onEndEditing={() => {
                            upsertSet(selectedChoiceId, s.set_index, s.weight, s.reps, s.rpe, null, s.rest_seconds);
                          }}
                          keyboardType="numeric"
                          style={[styles.setInput, { flex: 1 }, s.completed && styles.completedInput]}
                        />
                        <TextInput
                          value={String(s.reps)}
                          onChangeText={(text) => {
                            const reps = parseInt(text, 10) || 0;
                            setSetsByChoice((prev) => ({
                              ...prev,
                              [selectedChoiceId]: prev[selectedChoiceId].map((x) =>
                                x.id === s.id ? { ...x, reps } : x
                              ),
                            }));
                          }}
                          onEndEditing={() => {
                            upsertSet(selectedChoiceId, s.set_index, s.weight, s.reps, s.rpe, null, s.rest_seconds);
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
                            upsertSet(selectedChoiceId, s.set_index, s.weight, s.reps, s.rpe, null, s.rest_seconds);
                          }}
                          keyboardType="decimal-pad"
                          placeholder="RPE"
                          style={[styles.setInput, { width: 52 }, s.completed && styles.completedInput]}
                        />
                      </View>
                    ))}
                  </>
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
  discardBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
  },
  discardBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  finishBtn: {
    backgroundColor: '#1A7F37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
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
  slotTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
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
  completedText: { color: '#999', textDecorationLine: 'line-through' },
  
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
