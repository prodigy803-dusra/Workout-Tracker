import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { executeSqlAsync } from '../db/db';
import { listExerciseOptions, createExerciseOption } from '../db/repositories/exercisesRepo';

export default function ExerciseDetailScreen({ route }: any) {
  const { exerciseId, name } = route.params;
  const [stats, setStats] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [newOption, setNewOption] = useState('');

  async function loadStats() {
    const res = await executeSqlAsync(
      `
      SELECT
        MAX(CASE WHEN se.reps BETWEEN 1 AND 12 THEN se.weight * (1 + se.reps / 30.0) END) as best_e1rm,
        MAX(se.weight * se.reps) as best_volume,
        MAX(s.performed_at) as last_performed
      FROM sets se
      JOIN session_slot_choices ssc ON ssc.id = se.session_slot_choice_id
      JOIN template_slot_options tco ON tco.id = ssc.template_slot_option_id
      JOIN sessions s ON s.id = (SELECT session_id FROM session_slots WHERE id = ssc.session_slot_id)
      WHERE tco.exercise_id = ? AND s.status='final';
      `,
      [exerciseId]
    );
    setStats(res.rows.item(0));
  }

  async function loadOptions() {
    const opts = await listExerciseOptions(exerciseId);
    setOptions(opts);
  }

  useEffect(() => {
    loadStats();
    loadOptions();
  }, [exerciseId]);

  async function handleAddOption() {
    const optName = newOption.trim();
    if (!optName) return;
    await createExerciseOption(exerciseId, optName, options.length);
    setNewOption('');
    await loadOptions();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>

      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Best e1RM</Text>
          <Text style={styles.statValue}>{stats?.best_e1rm?.toFixed(1) || '—'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Best volume set</Text>
          <Text style={styles.statValue}>{stats?.best_volume?.toFixed(1) || '—'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Last performed</Text>
          <Text style={styles.statValue}>
            {stats?.last_performed ? new Date(stats.last_performed).toLocaleDateString() : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.optionsCard}>
        <Text style={styles.sectionTitle}>Variants</Text>
        {options.length === 0 && (
          <Text style={styles.emptyText}>No variants yet</Text>
        )}
        {options.map((o) => (
          <View key={o.id} style={styles.optionRow}>
            <Text style={styles.optionText}>{o.name}</Text>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            value={newOption}
            onChangeText={setNewOption}
            placeholder="e.g. Dumbbell, Close-grip..."
            style={styles.input}
          />
          <Pressable style={styles.addBtn} onPress={handleAddOption}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F4F1' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLabel: { fontSize: 15, color: '#666' },
  statValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  optionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  emptyText: { color: '#999', marginBottom: 8 },
  optionRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: { fontSize: 15, color: '#333' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: {
    flex: 1,
    backgroundColor: '#F6F4F1',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFF', fontWeight: '600' },
});
