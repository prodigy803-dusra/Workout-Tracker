import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, SectionList, Alert } from 'react-native';
import { listExercises, createExercise, deleteExercise } from '../db/repositories/exercisesRepo';
import { useColors } from '../contexts/ThemeContext';
import { useDebouncedCallback } from '../utils/debounce';
import type { Exercise, ExercisesStackParamList } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<ExercisesStackParamList, 'ExercisesHome'>;

/* ── Muscle-group display order & labels ──────────────────── */
const GROUP_ORDER = [
  'quads', 'hamstrings', 'glutes', 'calves', 'tibialis',
  'chest', 'lats', 'mid back', 'lower back',
  'shoulders front', 'shoulders side', 'shoulders rear', 'rear delt', 'traps',
  'biceps', 'triceps', 'core', 'conditioning',
];

const GROUP_LABELS: Record<string, string> = {
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  tibialis: 'Tibialis',
  chest: 'Chest',
  lats: 'Lats',
  'mid back': 'Mid Back',
  'lower back': 'Lower Back',
  'shoulders front': 'Shoulders (Front)',
  'shoulders side': 'Shoulders (Side)',
  'shoulders rear': 'Rear Delts',
  'rear delt': 'Rear Delts',
  traps: 'Traps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  core: 'Core',
  conditioning: 'Conditioning',
};

const EQUIP_COLORS: Record<string, string> = {
  barbell: '#4A90D9',
  dumbbell: '#6C5CE7',
  machine: '#00B894',
  cable: '#FDCB6E',
  bodyweight: '#E17055',
  'machine/cable': '#00B894',
  'dumbbell/kb': '#6C5CE7',
  'machine/db': '#00B894',
  'machine/barbell': '#00B894',
  'db/bb': '#6C5CE7',
  'bodyweight/machine': '#E17055',
  'specialty bar': '#4A90D9',
  'trap bar': '#4A90D9',
  'ez bar': '#4A90D9',
  'ez/bb/db': '#4A90D9',
  'cable/db': '#FDCB6E',
  'cable/band': '#FDCB6E',
  'machine/band': '#00B894',
  wheel: '#E17055',
  sled: '#636E72',
  rope: '#636E72',
  'db/trap': '#636E72',
};

export default function ExercisesScreen({ navigation }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [newName, setNewName] = useState('');
  const c = useColors();

  const applySearch = useDebouncedCallback((val: string) => {
    setDebouncedSearch(val);
  }, 250);

  function load() {
    listExercises().then(setExercises);
  }

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return exercises;
    const q = debouncedSearch.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.aliases && e.aliases.toLowerCase().includes(q)) ||
        (e.primary_muscle && e.primary_muscle.toLowerCase().includes(q)) ||
        (e.equipment && e.equipment.toLowerCase().includes(q))
    );
  }, [exercises, debouncedSearch]);

  const sections = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const ex of filtered) {
      const key = ex.primary_muscle || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ex);
    }
    return GROUP_ORDER
      .filter((g) => grouped[g]?.length)
      .map((g) => ({
        title: GROUP_LABELS[g] || g,
        data: grouped[g],
      }))
      .concat(
        grouped['other']
          ? [{ title: 'Other', data: grouped['other'] }]
          : []
      );
  }, [filtered]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createExercise(name);
      setNewName('');
      load();
    } catch {
      Alert.alert('Duplicate', 'An exercise with that name already exists.');
    }
  }

  async function handleDelete(exercise: Exercise) {
    Alert.alert(
      'Delete Exercise',
      `Remove "${exercise.name}" from your exercise library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = await deleteExercise(exercise.id);
            if (deleted) {
              load();
            } else {
              Alert.alert(
                'In Use',
                'This exercise is used in one or more templates. Remove it from those templates first.'
              );
            }
          },
        },
      ]
    );
  }

  function equipColor(equip: string | null) {
    if (!equip) return '#AAA';
    return EQUIP_COLORS[equip.toLowerCase()] || '#AAA';
  }

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <View style={s.header}>
            <TextInput
              value={search}
              onChangeText={(val) => { setSearch(val); applySearch(val); }}
              placeholder="Search exercises, muscles, equipment..."
              placeholderTextColor={c.textTertiary}
              style={[s.searchInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
            />
            <View style={s.newRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Add custom exercise"
                placeholderTextColor={c.textTertiary}
                style={[s.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
              />
              <Pressable style={[s.createBtn, { backgroundColor: c.primary }]} onPress={handleCreate}>
                <Text style={[s.createBtnText, { color: c.primaryText }]}>Add</Text>
              </Pressable>
            </View>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={[s.sectionHeader, { backgroundColor: c.sectionHeaderBg, borderBottomColor: c.border }]}>
            <Text style={[s.sectionTitle, { color: c.textSecondary }]}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('ExerciseDetail', {
                exerciseId: item.id,
                name: item.name,
              })
            }
            onLongPress={() => handleDelete(item)}
            style={[s.row, { backgroundColor: c.card, borderBottomColor: c.border }]}
          >
            <View style={s.rowContent}>
              <Text style={[s.rowText, { color: c.text }]}>{item.name}</Text>
              {item.equipment && (
                <View
                  style={[
                    s.equipBadge,
                    { backgroundColor: equipColor(item.equipment) + '18' },
                  ]}
                >
                  <Text
                    style={[s.equipText, { color: equipColor(item.equipment) }]}
                  >
                    {item.equipment}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[s.chevron, { color: c.textTertiary }]}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyText, { color: c.textSecondary }]}>No exercises found</Text>
          </View>
        }
        ListFooterComponent={
          <Text style={[s.hintText, { color: c.textTertiary }]}>Long-press an exercise to delete it</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  header: { padding: 16, paddingBottom: 8, gap: 8 },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  newRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  createBtnText: { color: '#FFF', fontWeight: '600' },
  sectionHeader: {
    backgroundColor: '#F0EBE5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D9D0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowText: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  equipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equipText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chevron: { fontSize: 22, color: '#BBB', marginLeft: 4 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
  hintText: { textAlign: 'center', fontSize: 12, paddingVertical: 16, fontStyle: 'italic' },
});
