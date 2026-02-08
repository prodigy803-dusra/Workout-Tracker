import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, SectionList } from 'react-native';
import { listExercises, createExercise } from '../db/repositories/exercisesRepo';
import type { Exercise } from '../types';

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

export default function ExercisesScreen({ navigation }: any) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');

  function load() {
    listExercises().then(setExercises);
  }

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const filtered = useMemo(() => {
    if (!search.trim()) return exercises;
    const q = search.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.aliases && e.aliases.toLowerCase().includes(q)) ||
        (e.primary_muscle && e.primary_muscle.toLowerCase().includes(q)) ||
        (e.equipment && e.equipment.toLowerCase().includes(q))
    );
  }, [exercises, search]);

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
    await createExercise(name);
    setNewName('');
    load();
  }

  function equipColor(equip: string | null) {
    if (!equip) return '#AAA';
    return EQUIP_COLORS[equip.toLowerCase()] || '#AAA';
  }

  return (
    <View style={s.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <View style={s.header}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises, muscles, equipment..."
              placeholderTextColor="#AAA"
              style={s.searchInput}
            />
            <View style={s.newRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Add custom exercise"
                style={s.input}
              />
              <Pressable style={s.createBtn} onPress={handleCreate}>
                <Text style={s.createBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{title}</Text>
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
            style={s.row}
          >
            <View style={s.rowContent}>
              <Text style={s.rowText}>{item.name}</Text>
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
            <Text style={s.chevron}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No exercises found</Text>
          </View>
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
});
