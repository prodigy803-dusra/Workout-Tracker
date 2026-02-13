import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  getTemplate,
  addSlot,
  updateSlotName,
  deleteSlot,
  addTemplateSlotOption,
  deleteTemplateSlotOption,
  listPrescribedSets,
  replacePrescribedSets,
} from '../db/repositories/templatesRepo';
import { listExercises, listExerciseOptions } from '../db/repositories/exercisesRepo';
import { useColors } from '../contexts/ThemeContext';
import type { Exercise, ExerciseOption, TemplatesStackParamList } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<TemplatesStackParamList, 'TemplateEditor'>;

export default function TemplateEditorScreen({ route, navigation }: Props) {
  const { templateId } = route.params;
  const [tpl, setTpl] = useState<{ id: number; name: string } | null>(null);
  const [slots, setSlots] = useState<Array<{ id: number; slot_index: number; name: string | null }>>([]);
  const [options, setOptions] = useState<Array<{ id: number; template_slot_id: number; order_index: number; exercise_name: string; option_name: string | null; exercise_id: number; exercise_option_id: number | null }>>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const c = useColors();

  // Picker state
  const [pickerSlotId, setPickerSlotId] = useState<number | null>(null);
  const [pickerStep, setPickerStep] = useState<'exercise' | 'option'>('exercise');
  const [pickerExerciseId, setPickerExerciseId] = useState<number | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<any[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');

  // Prescribed sets editor state (per slot)
  const [editingSetsForSlot, setEditingSetsForSlot] = useState<number | null>(null);
  const [prescribedSets, setPrescribedSets] = useState<
    Array<{ set_index: number; weight: string; reps: string; rpe: string; rest: string }>
  >([]);

  async function load() {
    const t = await getTemplate(templateId);
    setTpl(t.template);
    setSlots(t.slots);
    setOptions(t.options);
    setExercises(await listExercises());
  }

  useEffect(() => {
    load();
  }, []);

  async function addNewSlot() {
    const maxIndex = slots.reduce((max: number, s: any) => Math.max(max, s.slot_index ?? 0), 0);
    const nextIndex = maxIndex + 1;
    try {
      await addSlot(templateId, nextIndex, `Slot ${nextIndex}`);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Could not add slot.');
    }
  }

  function openPicker(slotId: number) {
    setPickerSlotId(slotId);
    setPickerStep('exercise');
    setPickerExerciseId(null);
    setExerciseOptions([]);
    setPickerSearch('');
  }

  function closePicker() {
    setPickerSlotId(null);
    setPickerStep('exercise');
    setPickerExerciseId(null);
    setExerciseOptions([]);
    setPickerSearch('');
  }

  async function handlePickExercise(exerciseId: number) {
    setPickerExerciseId(exerciseId);
    const opts = await listExerciseOptions(exerciseId);
    if (opts.length === 0) {
      // No options — add directly with null option
      const order = options.filter((o) => o.template_slot_id === pickerSlotId).length;
      try {
        await addTemplateSlotOption(pickerSlotId!, exerciseId, null, order);
      } catch {
        Alert.alert('Duplicate', 'This exercise is already in the slot.');
      }
      closePicker();
      await load();
    } else {
      setExerciseOptions(opts);
      setPickerStep('option');
    }
  }

  async function handlePickOption(exerciseOptionId: number | null) {
    if (!pickerSlotId || !pickerExerciseId) return;
    const order = options.filter((o) => o.template_slot_id === pickerSlotId).length;
    try {
      await addTemplateSlotOption(pickerSlotId, pickerExerciseId, exerciseOptionId, order);
    } catch {
      Alert.alert('Duplicate', 'This option is already in the slot.');
    }
    closePicker();
    await load();
  }

  async function openPrescribedSetsEditor(slotId: number) {
    setEditingSetsForSlot(slotId);
    const existing = await listPrescribedSets(slotId);
    setPrescribedSets(
      existing.map((s) => ({
        set_index: s.set_index,
        weight: s.weight?.toString() || '',
        reps: s.reps?.toString() || '',
        rpe: s.rpe?.toString() || '',
        rest: s.rest_seconds?.toString() || '90',
      }))
    );
  }

  function closePrescribedSetsEditor() {
    setEditingSetsForSlot(null);
    setPrescribedSets([]);
  }

  function addPrescribedSet() {
    const maxIndex = prescribedSets.length > 0 ? Math.max(...prescribedSets.map(s => s.set_index)) : 0;
    setPrescribedSets([...prescribedSets, { set_index: maxIndex + 1, weight: '', reps: '', rpe: '', rest: '90' }]);
  }

  function removePrescribedSet(index: number) {
    setPrescribedSets((prev) => prev.filter((_, i) => i !== index));
  }

  async function savePrescribedSets() {
    if (!editingSetsForSlot) return;
    const toSave = prescribedSets.map((s) => ({
      set_index: s.set_index,
      weight: s.weight ? parseFloat(s.weight) : null,
      reps: s.reps ? parseInt(s.reps, 10) : null,
      rpe: s.rpe ? parseFloat(s.rpe) : null,
      rest_seconds: s.rest ? parseInt(s.rest, 10) : 90,
    }));
    await replacePrescribedSets(editingSetsForSlot, toSave);
    closePrescribedSetsEditor();
  }

  if (!tpl) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}>
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
      <Text style={[styles.templateName, { color: c.text }]}>{tpl.name}</Text>

      {slots.length > 0 && (
        <Pressable style={[styles.finishBtn, { backgroundColor: c.success }]} onPress={() => navigation.goBack()}>
          <Text style={styles.finishBtnText}>✓ Finish Editing</Text>
        </Pressable>
      )}

      {slots.map((s) => {
        const slotOpts = options.filter((o) => o.template_slot_id === s.id);
        return (
          <View key={s.id} style={[styles.slotCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <TextInput
              defaultValue={s.name || ''}
              onEndEditing={(e) => { updateSlotName(s.id, e.nativeEvent.text).catch(() => {}); }}
              placeholder="Slot name"
              placeholderTextColor={c.textTertiary}
              style={[styles.slotNameInput, { color: c.text, borderBottomColor: c.border }]}
            />
            <Text style={[styles.optionsLabel, { color: c.textSecondary }]}>Options:</Text>
            {slotOpts.map((o) => (
              <View key={o.id} style={[styles.optionRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.optionText, { color: c.text }]}>
                  {o.exercise_name}{o.option_name ? ` (${o.option_name})` : ''}
                </Text>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Remove Exercise',
                      `Remove "${o.exercise_name}${o.option_name ? ` (${o.option_name})` : ''}" from this slot?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: async () => {
                            await deleteTemplateSlotOption(o.id);
                            await load();
                          },
                        },
                      ]
                    );
                  }}
                  style={styles.removeBtn}
                >
                  <Text style={[styles.removeBtnText, { color: c.danger }]}>✕</Text>
                </Pressable>
              </View>
            ))}
            <View style={styles.slotActions}>
              <Pressable style={[styles.actionBtn, { backgroundColor: c.inputBg }]} onPress={() => openPicker(s.id)}>
                <Text style={[styles.actionBtnText, { color: c.text }]}>+ Add Exercise</Text>
              </Pressable>
              <Pressable
                style={[styles.setsBtn, { backgroundColor: c.accentBg }]}
                onPress={() => openPrescribedSetsEditor(s.id)}
              >
                <Text style={[styles.setsBtnText, { color: c.accent }]}>📋 Prescribed Sets</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: c.dangerBg }]}
                onPress={() => {
                  Alert.alert(
                    'Delete Slot',
                    `Delete "${s.name || `Slot ${s.slot_index}`}" and all its exercises?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteSlot(s.id);
                          await load();
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.actionBtnText, { color: c.danger }]}>Delete Slot</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Pressable onPress={addNewSlot} style={[styles.addSlotBtn, { borderColor: c.border, backgroundColor: c.card }]}>
        <Text style={[styles.addSlotBtnText, { color: c.textSecondary }]}>+ Add Slot</Text>
      </Pressable>

      {/* Exercise / Option Picker Modal */}
      <Modal visible={pickerSlotId !== null} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: c.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.modalTitle, { color: c.text }]}>
                {pickerStep === 'exercise' ? 'Choose Exercise' : 'Choose Variant'}
              </Text>
              <Pressable onPress={closePicker}>
                <Text style={[styles.modalClose, { color: c.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {pickerStep === 'exercise' && (
              <>
                <TextInput
                  value={pickerSearch}
                  onChangeText={setPickerSearch}
                  placeholder="Search exercises…"
                  placeholderTextColor={c.textTertiary}
                  autoFocus
                  style={[styles.pickerSearch, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
                />
                <FlatList
                  data={exercises.filter((e: any) => {
                    if (!pickerSearch.trim()) return true;
                    const q = pickerSearch.toLowerCase();
                    return (
                      e.name?.toLowerCase().includes(q) ||
                      e.primary_muscle?.toLowerCase().includes(q) ||
                      e.equipment?.toLowerCase().includes(q) ||
                      e.aliases?.toLowerCase().includes(q)
                    );
                  })}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handlePickExercise(item.id)}
                      style={[styles.pickerRow, { borderBottomColor: c.border }]}
                    >
                      <Text style={[styles.pickerRowText, { color: c.text }]}>{item.name}</Text>
                      {item.primary_muscle ? (
                        <Text style={[styles.pickerRowSub, { color: c.textSecondary }]}>{item.primary_muscle}</Text>
                      ) : null}
                    </Pressable>
                  )}
                />
              </>
            )}

            {pickerStep === 'option' && (
              <FlatList
                data={[{ id: null, name: 'No variant (any)' }, ...exerciseOptions]}
                keyExtractor={(item) => String(item.id ?? 'none')}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handlePickOption(item.id)}
                    style={[styles.pickerRow, { borderBottomColor: c.border }]}
                  >
                    <Text style={[styles.pickerRowText, { color: c.text }]}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Prescribed Sets Editor Modal */}
      <Modal visible={editingSetsForSlot !== null} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: c.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Prescribed Sets</Text>
              <Pressable onPress={closePrescribedSetsEditor}>
                <Text style={[styles.modalClose, { color: c.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.setsEditorScroll}>
              {prescribedSets.map((s, idx) => (
                <View key={idx} style={[styles.setEditorCard, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                  <View style={styles.setEditorHeader}>
                    <Text style={[styles.setIndexText, { color: c.textSecondary }]}>Set {s.set_index}</Text>
                    <Pressable onPress={() => removePrescribedSet(idx)} style={styles.removeSetBtn}>
                      <Text style={[styles.removeSetBtnText, { color: c.danger }]}>✕</Text>
                    </Pressable>
                  </View>
                  <View style={styles.setEditorRow}>
                    <TextInput
                      value={s.weight}
                      onChangeText={(text) => {
                        setPrescribedSets((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, weight: text } : x))
                        );
                      }}
                      placeholder="Weight"
                      placeholderTextColor={c.textTertiary}
                      keyboardType="numeric"
                      style={[styles.setInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
                    />
                    <TextInput
                      value={s.reps}
                      onChangeText={(text) => {
                        setPrescribedSets((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, reps: text } : x))
                        );
                      }}
                      placeholder="Reps"
                      placeholderTextColor={c.textTertiary}
                      keyboardType="numeric"
                      style={[styles.setInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
                    />
                    <TextInput
                      value={s.rpe}
                      onChangeText={(text) => {
                        setPrescribedSets((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, rpe: text } : x))
                        );
                      }}
                      placeholder="RPE"
                      placeholderTextColor={c.textTertiary}
                      keyboardType="numeric"
                      style={[styles.setInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
                    />
                  </View>
                  <View style={styles.restRow}>
                    <Text style={[styles.restLabel, { color: c.textSecondary }]}>Rest time:</Text>
                    <TextInput
                      value={s.rest}
                      onChangeText={(text) => {
                        setPrescribedSets((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, rest: text } : x))
                        );
                      }}
                      placeholder="90"
                      placeholderTextColor={c.textTertiary}
                      keyboardType="numeric"
                      style={[styles.restInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
                    />
                    <Text style={[styles.restLabel, { color: c.textSecondary }]}>seconds</Text>
                  </View>
                </View>
              ))}

              <Pressable onPress={addPrescribedSet} style={[styles.addSetBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}>
                <Text style={[styles.addSetBtnText, { color: c.textSecondary }]}>+ Add Set</Text>
              </Pressable>
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: c.border }]}>
              <Pressable style={[styles.saveSetsBtn, { backgroundColor: c.success }]} onPress={savePrescribedSets}>
                <Text style={styles.saveSetsBtnText}>Save Sets</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F4F1' },
  templateName: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  finishBtn: {
    backgroundColor: '#1A7F37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  slotCard: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  slotNameInput: {
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingBottom: 6,
    marginBottom: 10,
  },
  optionsLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: { fontSize: 15, color: '#333' },
  removeBtn: { padding: 4 },
  removeBtnText: { color: '#C00', fontSize: 16 },
  setsBtn: {
    backgroundColor: '#F0F7FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  setsBtnText: { fontSize: 13, color: '#1E90FF', fontWeight: '600' },
  slotActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#333' },
  dangerBtn: { backgroundColor: '#FFF0F0' },
  dangerText: { color: '#C00' },
  addSlotBtn: {
    marginTop: 4,
    marginBottom: 32,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    backgroundColor: '#FFF',
  },
  addSlotBtnText: { fontSize: 15, fontWeight: '600', color: '#555' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 20, color: '#888', padding: 4 },
  pickerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerRowText: { fontSize: 16, color: '#1A1A1A' },
  pickerRowSub: { fontSize: 12, color: '#888', marginTop: 2 },
  pickerSearch: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#F9F9F9',
  },
  setsEditorScroll: { maxHeight: 400, paddingHorizontal: 16 },
  setEditorCard: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  setEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  setEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setIndexText: { fontSize: 14, fontWeight: '600', color: '#555' },
  setInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFF',
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  restLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  restInput: {
    width: 70,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    textAlign: 'center',
  },
  removeSetBtn: { padding: 4 },
  removeSetBtnText: { color: '#C00', fontSize: 16 },
  addSetBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BBB',
    backgroundColor: '#FAFAFA',
  },
  addSetBtnText: { fontSize: 14, fontWeight: '600', color: '#555' },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  saveSetsBtn: {
    backgroundColor: '#1A7F37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveSetsBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
