import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { executeSqlAsync } from '../db/db';
import { listExerciseOptions, createExerciseOption } from '../db/repositories/exercisesRepo';
import { e1rmHistory } from '../db/repositories/statsRepo';
import MuscleMap from '../components/MuscleMap';
import TrendChart, { DataPoint } from '../components/TrendChart';
import { getMuscleInfo, ALL_MUSCLE_IDS } from '../data/muscleExerciseMap';
import type { ExerciseStats, ExerciseGuideData, ExerciseOption } from '../types';

export default function ExerciseDetailScreen({ route }: any) {
  const { exerciseId, name } = route.params;
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [options, setOptions] = useState<Pick<ExerciseOption, 'id' | 'name' | 'order_index'>[]>([]);
  const [newOption, setNewOption] = useState('');
  const [guide, setGuide] = useState<ExerciseGuideData>({ video_url: null, instructions: null, tips: null });
  const [trendData, setTrendData] = useState<DataPoint[]>([]);

  async function loadGuide() {
    const res = await executeSqlAsync(
      `SELECT video_url, instructions, tips FROM exercises WHERE id=?;`,
      [exerciseId]
    );
    if (res.rows.length) setGuide(res.rows.item(0));
  }

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

  // Resolve muscle groups for this exercise
  const muscleInfo = useMemo(() => getMuscleInfo(name), [name]);
  const primaryMuscles = useMemo(() => {
    if (!muscleInfo) return [];
    if (muscleInfo.primary === 'full_body') return ALL_MUSCLE_IDS;
    return [muscleInfo.primary];
  }, [muscleInfo]);
  const secondaryMuscles = useMemo(() => {
    if (!muscleInfo?.secondary) return [];
    if (muscleInfo.secondary === 'full_body') return ALL_MUSCLE_IDS;
    return [muscleInfo.secondary];
  }, [muscleInfo]);

  useEffect(() => {
    loadStats();
    loadOptions();
    loadGuide();
    e1rmHistory(exerciseId).then(setTrendData);
  }, [exerciseId]);

  async function handleAddOption() {
    const optName = newOption.trim();
    if (!optName) return;
    await createExerciseOption(exerciseId, optName, options.length);
    setNewOption('');
    await loadOptions();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>{name}</Text>

      {muscleInfo && (
        <View style={styles.muscleCard}>
          <Text style={styles.sectionTitle}>Muscles Worked</Text>
          <MuscleMap
            primaryMuscles={primaryMuscles}
            secondaryMuscles={secondaryMuscles}
          />
          <View style={styles.muscleLabels}>
            <Text style={styles.muscleLabel}>
              <Text style={{ color: '#E8443A', fontWeight: '700' }}>●</Text>{' '}
              {muscleInfo.primary.replace(/_/g, ' ')}
            </Text>
            {muscleInfo.secondary && (
              <Text style={styles.muscleLabel}>
                <Text style={{ color: '#F5A623', fontWeight: '700' }}>●</Text>{' '}
                {muscleInfo.secondary.replace(/_/g, ' ')}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* ── How To Perform ── */}
      {guide.instructions && (
        <View style={styles.guideCard}>
          <Text style={styles.sectionTitle}>How To Perform</Text>
          {guide.instructions.split('\n').map((line, i) => (
            <Text key={i} style={styles.stepText}>{line}</Text>
          ))}
        </View>
      )}

      {/* ── Tips ── */}
      {guide.tips && (
        <View style={styles.guideCard}>
          <Text style={styles.sectionTitle}>Tips</Text>
          {guide.tips.split('\n').map((line, i) => (
            <Text key={i} style={styles.tipText}>{line}</Text>
          ))}
        </View>
      )}

      {/* ── Watch Video ── */}
      {guide.video_url && (
        <Pressable
          style={styles.videoBtn}
          onPress={() => Linking.openURL(guide.video_url!)}
        >
          <Text style={styles.videoBtnText}>▶  Watch Video Tutorial</Text>
        </Pressable>
      )}

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

      {/* ── e1RM Trend Chart ── */}
      {trendData.length >= 2 && (
        <View style={styles.statsCard}>
          <TrendChart data={trendData} label="Estimated 1RM Trend" unit="weight" color="#4A90D9" />
        </View>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F4F1' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  muscleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  muscleLabels: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
    justifyContent: 'center',
  },
  muscleLabel: {
    fontSize: 13,
    color: '#555',
    textTransform: 'capitalize',
  },
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
  guideCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  stepText: { fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 4 },
  tipText: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 4 },
  videoBtn: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  videoBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
