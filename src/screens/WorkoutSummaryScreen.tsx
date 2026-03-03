/**
 * WorkoutSummaryScreen — shown after a workout is finalized.
 * Displays total volume, duration, exercises, sets, any PRs hit,
 * and comparison with the previous session (progression/regression badges).
 */
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Share, ActivityIndicator } from 'react-native';
import { useColors, ThemeColors } from '../contexts/ThemeContext';
import { useUnit } from '../contexts/UnitContext';
import { getSessionDetail } from '../db/repositories/sessionsRepo';
import { getSessionPRs, sessionExerciseDeltas, previousSessionComparison, sessionEffortStats } from '../db/repositories/statsRepo';
import type { ExerciseDelta, SessionEffortStats } from '../db/repositories/statsRepo';
import { listActiveInjuries } from '../db/repositories/injuryRepo';
import type { Injury } from '../db/repositories/injuryRepo';
import { isExerciseAffected, INJURY_REGIONS, SEVERITIES } from '../data/injuryRegionMap';
import { getMuscleInfo } from '../data/muscleExerciseMap';
import ConfettiCannon from '../components/ConfettiCannon';
import { haptic } from '../utils/haptics';
import type { SessionDetail, LogStackParamList } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type PRRecord = {
  exercise_name: string;
  pr_type: string;
  value: number;
  previous_value: number | null;
};

type PrevComparison = { prevVolume: number | null; prevDurationSecs: number | null };

type Props = NativeStackScreenProps<LogStackParamList, 'WorkoutSummary'>;

export default function WorkoutSummaryScreen({ route, navigation }: Props) {
  const { sessionId, duration } = route.params;
  const c = useColors();
  const { unit } = useUnit();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deltas, setDeltas] = useState<ExerciseDelta[]>([]);
  const [prevComp, setPrevComp] = useState<PrevComparison>({ prevVolume: null, prevDurationSecs: null });
  const [effort, setEffort] = useState<SessionEffortStats | null>(null);
  const [activeInjuries, setActiveInjuries] = useState<Injury[]>([]);

  useEffect(() => {
    getSessionDetail(sessionId).then(setDetail);
    getSessionPRs(sessionId).then((records) => {
      setPrs(records);
      if (records.length > 0) {
        setShowConfetti(true);
        haptic('success');
      }
    });
    sessionExerciseDeltas(sessionId).then(setDeltas);
    previousSessionComparison(sessionId).then(setPrevComp);
    sessionEffortStats(sessionId, duration || undefined).then(setEffort);
    listActiveInjuries().then(setActiveInjuries);
  }, [sessionId]);

  // Determine which exercises were done under injury — override 'regressed' to 'recovery'
  // Must be before early return to satisfy Rules of Hooks
  const injuryAffectedExercises = useMemo(() => {
    const set = new Set<string>();
    if (!activeInjuries.length) return set;
    for (const d of deltas) {
      const info = getMuscleInfo(d.exercise_name);
      for (const injury of activeInjuries) {
        if (isExerciseAffected(info?.primary ?? null, info?.secondary ?? null, null, injury.body_region)) {
          set.add(d.exercise_name);
          break;
        }
      }
    }
    return set;
  }, [deltas, activeInjuries]);

  if (!detail) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );

  const completedSets = detail.sets.filter((s: any) => s.completed && !s.is_warmup);
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

  // Comparison helpers
  const volumeDiffPct = prevComp.prevVolume != null && prevComp.prevVolume > 0
    ? ((totalVolume - prevComp.prevVolume) / prevComp.prevVolume * 100)
    : null;
  const durationDiffSecs = prevComp.prevDurationSecs != null && duration
    ? (duration - prevComp.prevDurationSecs)
    : null;

  const progressed = deltas.filter(d => d.status === 'progressed').length;
  const maintained = deltas.filter(d => d.status === 'maintained').length;
  const newExercises = deltas.filter(d => d.status === 'new').length;
  const skipped = deltas.filter(d => d.status === 'skipped').length;

  const recoveryCount = deltas.filter(d => d.status === 'regressed' && injuryAffectedExercises.has(d.exercise_name)).length;
  const regressed = deltas.filter(d => d.status === 'regressed').length - recoveryCount;
  const hasReviewData = progressed + regressed + recoveryCount + maintained + newExercises > 0;

  const statusBadge = (status: ExerciseDelta['status'], exerciseName?: string) => {
    if (status === 'regressed' && exerciseName && injuryAffectedExercises.has(exerciseName)) return '🛡️';
    switch (status) {
      case 'progressed': return '📈';
      case 'regressed': return '📉';
      case 'maintained': return '➡️';
      case 'new': return '🆕';
      case 'skipped': return '⏭️';
    }
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
    if (volumeDiffPct != null) {
      lines.push(`${volumeDiffPct >= 0 ? '📈' : '📉'} Volume: ${volumeDiffPct >= 0 ? '+' : ''}${volumeDiffPct.toFixed(1)}% vs last`);
    }
    if (effort?.hasData) {
      lines.push(`⚡ Avg Rest: ${formatDuration(effort.avgRestSecs)} | Density: ${effort.setsPerMinute} sets/min`);
    }
    if (prs.length > 0) {
      lines.push('');
      lines.push(`🏆 Personal Records: ${prs.length}`);
      for (const pr of prs) {
        lines.push(
          `  ⭐ ${pr.exercise_name}: ${pr.value.toFixed(1)} ${unit} ${pr.pr_type}`
        );
      }
    }
    if (deltas.length > 0) {
      lines.push('');
      if (progressed > 0) lines.push(`📈 Progressed: ${progressed}`);
      if (regressed > 0) lines.push(`📉 Regressed: ${regressed}`);
      if (recoveryCount > 0) lines.push(`🛡️ Recovery: ${recoveryCount}`);
      if (maintained > 0) lines.push(`➡️ Maintained: ${maintained}`);
      if (skipped > 0) lines.push(`⏭️ Skipped: ${skipped}`);
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
          {durationDiffSecs != null && (
            <Text style={[s.statDelta, { color: durationDiffSecs <= 0 ? c.success : c.textSecondary }]}>
              {durationDiffSecs <= 0 ? '' : '+'}{formatDuration(Math.abs(durationDiffSecs))} vs last
            </Text>
          )}
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
            {completedSets.length}/{detail.sets.filter((s: any) => !s.is_warmup).length}
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
          {volumeDiffPct != null && (
            <Text style={[s.statDelta, { color: volumeDiffPct >= 0 ? c.success : c.danger }]}>
              {volumeDiffPct >= 0 ? '+' : ''}{volumeDiffPct.toFixed(1)}%
            </Text>
          )}
          <Text style={s.statLabel}>Volume ({unit})</Text>
        </View>
      </View>

      {/* Progression summary banner */}
      {hasReviewData && (
        <View style={s.progressionBanner}>
          <Text style={s.progressionTitle}>Workout Review</Text>
          <View style={s.progressionRow}>
            {progressed > 0 && (
              <View style={s.progressionChip}>
                <Text style={s.progressionChipText}>📈 {progressed} progressed</Text>
              </View>
            )}
            {maintained > 0 && (
              <View style={s.progressionChip}>
                <Text style={s.progressionChipText}>➡️ {maintained} maintained</Text>
              </View>
            )}
            {regressed > 0 && (
              <View style={[s.progressionChip, { backgroundColor: c.isDark ? '#3A1A1A' : '#FFEBEE' }]}>
                <Text style={s.progressionChipText}>📉 {regressed} regressed</Text>
              </View>
            )}
            {recoveryCount > 0 && (
              <View style={[s.progressionChip, { backgroundColor: c.isDark ? '#2A2A1A' : '#FFF8E1' }]}>
                <Text style={s.progressionChipText}>🛡️ {recoveryCount} recovery</Text>
              </View>
            )}
            {newExercises > 0 && (
              <View style={s.progressionChip}>
                <Text style={s.progressionChipText}>🆕 {newExercises} new</Text>
              </View>
            )}
            {skipped > 0 && (
              <View style={s.progressionChip}>
                <Text style={s.progressionChipText}>⏭️ {skipped} skipped</Text>
              </View>
            )}
          </View>
        </View>
      )}

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

      {/* Effort / Rest-time stats */}
      {effort?.hasData && (
        <View style={s.effortSection}>
          <Text style={s.sectionTitle}>⚡ Effort & Rest</Text>
          <View style={s.effortGrid}>
            <View style={s.effortItem}>
              <Text style={s.effortValue}>{formatDuration(effort.totalRestSecs)}</Text>
              <Text style={s.effortLabel}>Total Rest</Text>
            </View>
            <View style={s.effortItem}>
              <Text style={s.effortValue}>{formatDuration(effort.avgRestSecs)}</Text>
              <Text style={s.effortLabel}>Avg Rest / Set</Text>
            </View>
            <View style={s.effortItem}>
              <Text style={s.effortValue}>{effort.setsPerMinute}</Text>
              <Text style={s.effortLabel}>Sets / Min</Text>
            </View>
            <View style={s.effortItem}>
              <Text style={s.effortValue}>
                {effort.volumePerMinute >= 1000
                  ? `${(effort.volumePerMinute / 1000).toFixed(1)}k`
                  : effort.volumePerMinute}
              </Text>
              <Text style={s.effortLabel}>{unit} / Min</Text>
            </View>
          </View>
        </View>
      )}

      {/* Exercises performed (with delta badges) */}
      <View style={s.exercisesSection}>
        <Text style={s.sectionTitle}>Exercises</Text>
        {detail.slots.map((slot) => {
          const sets = detail.sets.filter(
            (st: any) => st.session_slot_choice_id === slot.session_slot_choice_id && !st.is_warmup
          );
          const completed = sets.filter((st: any) => st.completed);
          const delta = deltas.find(d => d.exercise_name === slot.exercise_name);
          return (
            <View key={slot.session_slot_id} style={s.exerciseRow}>
              <View style={s.exerciseInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {delta && <Text style={{ fontSize: 14 }}>{statusBadge(delta.status, delta.exercise_name)}</Text>}
                  <Text style={s.exerciseName}>
                    {slot.exercise_name}
                    {slot.option_name ? ` (${slot.option_name})` : ''}
                  </Text>
                </View>
                <Text style={s.exerciseSets}>
                  {completed.length}/{sets.length} sets
                </Text>
                {/* Delta detail */}
                {delta && delta.status !== 'new' && delta.status !== 'skipped' && (
                  <Text style={[s.exerciseDelta, {
                    color: delta.status === 'progressed' ? c.success
                      : delta.status === 'regressed' && injuryAffectedExercises.has(delta.exercise_name) ? '#E6A817'
                      : delta.status === 'regressed' ? c.danger
                      : c.textSecondary
                  }]}>
                    {delta.status === 'regressed' && injuryAffectedExercises.has(delta.exercise_name)
                      ? 'Recovery mode — lighter weight expected'
                      : [
                          delta.top_weight !== delta.prev_top_weight && delta.prev_top_weight != null
                            ? `Top: ${delta.prev_top_weight}→${delta.top_weight} ${unit}  `
                            : '',
                          delta.total_volume !== delta.prev_total_volume && delta.prev_total_volume != null
                            ? `Vol: ${delta.prev_total_volume >= 1000 ? `${(delta.prev_total_volume/1000).toFixed(1)}k` : delta.prev_total_volume}→${delta.total_volume >= 1000 ? `${(delta.total_volume/1000).toFixed(1)}k` : delta.total_volume}`
                            : '',
                        ].filter(Boolean).join('')
                    }
                  </Text>
                )}
                {delta && delta.status === 'new' && (
                  <Text style={[s.exerciseDelta, { color: c.accent }]}>First time!</Text>
                )}
                {delta && delta.status === 'skipped' && (
                  <Text style={[s.exerciseDelta, { color: c.textTertiary ?? c.textSecondary }]}>Skipped</Text>
                )}
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
    statDelta: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
      marginTop: 4,
    },

    progressionBanner: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    progressionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 10,
    },
    progressionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    progressionChip: {
      backgroundColor: c.isDark ? '#1A2E1F' : '#E6F9ED',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    progressionChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
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

    effortSection: {
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    effortGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    effortItem: {
      flex: 1,
      minWidth: '44%' as any,
      alignItems: 'center',
      paddingVertical: 10,
    },
    effortValue: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
    },
    effortLabel: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
      marginTop: 4,
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
    exerciseDelta: {
      fontSize: 12,
      fontWeight: '600',
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
