/**
 * WorkoutSummaryScreen — shown after a workout is finalized.
 * Displays total volume, duration, exercises, sets, and any PRs hit.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Share, ActivityIndicator } from 'react-native';
import { useColors, ThemeColors } from '../contexts/ThemeContext';
import { useUnit } from '../contexts/UnitContext';
import { getSessionDetail } from '../db/repositories/sessionsRepo';
import { getSessionPRs } from '../db/repositories/statsRepo';
import ConfettiCannon from '../components/ConfettiCannon';
import { haptic } from '../utils/haptics';
import type { SessionDetail } from '../types';

type PRRecord = {
  exercise_name: string;
  pr_type: string;
  value: number;
  previous_value: number | null;
};

export default function WorkoutSummaryScreen({ route, navigation }: any) {
  const { sessionId, duration } = route.params;
  const c = useColors();
  const { unit } = useUnit();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    getSessionDetail(sessionId).then(setDetail);
    getSessionPRs(sessionId).then((records) => {
      setPrs(records);
      if (records.length > 0) {
        setShowConfetti(true);
        haptic('success');
      }
    });
  }, [sessionId]);

  if (!detail) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );

  const completedSets = detail.sets.filter((s: any) => s.completed);
  const totalVolume = completedSets.reduce(
    (sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0),
    0
  );
  const exerciseNames = [...new Set(detail.slots.map((s) => s.exercise_name))];

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  async function handleShare() {
    const lines = [
      `🏋️ Workout Complete!`,
      `📑 ${detail!.session.template_name || 'Session'}`,
      `⏱️ Duration: ${formatDuration(duration || 0)}`,
      `💪 Exercises: ${exerciseNames.length}`,
      `✅ Sets: ${completedSets.length}/${detail!.sets.length}`,
      `📦 Volume: ${totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume} ${unit}`,
    ];
    if (prs.length > 0) {
      lines.push('');
      lines.push(`🏆 Personal Records: ${prs.length}`);
      for (const pr of prs) {
        lines.push(
          `  ⭐ ${pr.exercise_name}: ${pr.value.toFixed(1)} ${unit} ${pr.pr_type}`
        );
      }
    }
    lines.push('');
    lines.push('— WorkoutApp');

    await Share.share({ message: lines.join('\n') });
  }

  const s = makeStyles(c);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Trophy header */}
      <View style={s.header}>
        <Text style={s.trophy}>🎉</Text>
        <Text style={s.headerTitle}>Workout Complete!</Text>
        <Text style={s.headerSub}>
          {detail.session.template_name || 'Session'}
        </Text>
      </View>

      {/* Stats grid */}
      <View style={s.statsGrid}>
        <View style={s.statCard}>
          <Text style={s.statIcon}>⏱️</Text>
          <Text style={s.statValue}>{formatDuration(duration || 0)}</Text>
          <Text style={s.statLabel}>Duration</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>💪</Text>
          <Text style={s.statValue}>{exerciseNames.length}</Text>
          <Text style={s.statLabel}>Exercises</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>✅</Text>
          <Text style={s.statValue}>
            {completedSets.length}/{detail.sets.length}
          </Text>
          <Text style={s.statLabel}>Sets</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statIcon}>📦</Text>
          <Text style={s.statValue}>
            {totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume.toFixed(0)}
          </Text>
          <Text style={s.statLabel}>Volume ({unit})</Text>
        </View>
      </View>

      {/* PRs section */}
      {prs.length > 0 && (
        <View style={s.prSection}>
          <Text style={s.prTitle}>🏆 Personal Records!</Text>
          {prs.map((pr, i) => (
            <View key={i} style={s.prCard}>
              <Text style={s.prStar}>⭐</Text>
              <View style={s.prInfo}>
                <Text style={s.prExercise}>{pr.exercise_name}</Text>
                <Text style={s.prDetail}>
                  New best {pr.pr_type}: {pr.value.toFixed(1)} {unit}
                  {pr.previous_value
                    ? ` (was ${pr.previous_value.toFixed(1)})`
                    : ' — first record!'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Exercises performed */}
      <View style={s.exercisesSection}>
        <Text style={s.sectionTitle}>Exercises</Text>
        {detail.slots.map((slot) => {
          const sets = detail.sets.filter(
            (s: any) => s.session_slot_choice_id === slot.session_slot_choice_id
          );
          const completed = sets.filter((s: any) => s.completed);
          return (
            <View key={slot.session_slot_id} style={s.exerciseRow}>
              <View style={s.exerciseInfo}>
                <Text style={s.exerciseName}>
                  {slot.exercise_name}
                  {slot.option_name ? ` (${slot.option_name})` : ''}
                </Text>
                <Text style={s.exerciseSets}>
                  {completed.length}/{sets.length} sets
                </Text>
              </View>
              {completed.length === sets.length && (
                <Text style={s.checkmark}>✓</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <Pressable style={s.shareBtn} onPress={handleShare}>
          <Text style={s.shareBtnText}>📤 Share Workout</Text>
        </Pressable>
        <Pressable
          style={s.doneBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.doneBtnText}>Done</Text>
        </Pressable>
      </View>
      {/* Confetti overlay */}
      <ConfettiCannon active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </ScrollView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, paddingBottom: 40 },

    header: { alignItems: 'center', marginBottom: 24 },
    trophy: { fontSize: 56, marginBottom: 8 },
    headerTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: c.text,
    },
    headerSub: {
      fontSize: 16,
      color: c.textSecondary,
      marginTop: 4,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      minWidth: '46%' as any,
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    statIcon: { fontSize: 22, marginBottom: 6 },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
      marginTop: 4,
    },

    prSection: {
      backgroundColor: c.warningBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.warning,
    },
    prTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: c.text,
      marginBottom: 12,
    },
    prCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.warning + '40',
    },
    prStar: { fontSize: 20 },
    prInfo: { flex: 1 },
    prExercise: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    prDetail: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 2,
    },

    exercisesSection: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 12,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    exerciseInfo: { flex: 1 },
    exerciseName: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    exerciseSets: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 2,
    },
    checkmark: {
      fontSize: 16,
      color: c.success,
      fontWeight: '700',
    },

    actions: { gap: 10 },
    shareBtn: {
      backgroundColor: c.card,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    shareBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    doneBtn: {
      backgroundColor: c.success,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    doneBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
  });
}
