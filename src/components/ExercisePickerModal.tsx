/**
 * ExercisePickerModal — full-screen modal to pick an exercise from the library.
 * Used mid-workout to add an exercise to the current session.
 *
 * Shows a searchable list; tapping an exercise calls `onPick(exerciseId, name)`.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColors, ThemeColors } from '../contexts/ThemeContext';
import { listExercises } from '../db/repositories/exercisesRepo';
import { normalizeName } from '../utils/normalize';

type Exercise = { id: number; name: string; primary_muscle: string | null; equipment: string | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (exerciseId: number, exerciseName: string) => void;
};

export default function ExercisePickerModal({ visible, onClose, onPick }: Props) {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      listExercises().then((rows) => setExercises(rows as Exercise[]));
      setQuery('');
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return exercises;
    const norm = normalizeName(query);
    return exercises.filter(
      (e) =>
        normalizeName(e.name).includes(norm) ||
        (e.primary_muscle && normalizeName(e.primary_muscle).includes(norm)) ||
        (e.equipment && normalizeName(e.equipment).includes(norm))
    );
  }, [exercises, query]);

  const handlePick = useCallback(
    (id: number, name: string) => {
      onPick(id, name);
    },
    [onPick]
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <Pressable
        style={[s.item, { backgroundColor: c.card, borderColor: c.border }]}
        onPress={() => handlePick(item.id, item.name)}
      >
        <Text style={[s.itemName, { color: c.text }]}>{item.name}</Text>
        {item.primary_muscle && (
          <Text style={[s.itemMuscle, { color: c.textSecondary }]}>{item.primary_muscle}</Text>
        )}
      </Pressable>
    ),
    [c, s, handlePick]
  );

  const keyExtractor = useCallback((item: Exercise) => String(item.id), []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[s.container, { backgroundColor: c.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[s.header, { borderBottomColor: c.border }]}>
          <Text style={[s.title, { color: c.text }]}>Add Exercise</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[s.closeBtn, { color: c.accent }]}>Cancel</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises..."
            placeholderTextColor={c.textTertiary}
            autoFocus
            style={[s.searchInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
          />
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={[s.empty, { color: c.textTertiary }]}>
              {exercises.length === 0 ? 'Loading...' : 'No exercises found'}
            </Text>
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 16 : 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    title: { fontSize: 18, fontWeight: '700' },
    closeBtn: { fontSize: 16, fontWeight: '600' },
    searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
    searchInput: {
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 14,
      fontSize: 15,
    },
    list: { paddingHorizontal: 16, paddingBottom: 40 },
    item: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 6,
    },
    itemName: { fontSize: 15, fontWeight: '600' },
    itemMuscle: { fontSize: 12, marginTop: 2 },
    empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  });
}
