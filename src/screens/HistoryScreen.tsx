import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { listHistory } from '../db/repositories/sessionsRepo';
import { overallStats, weeklyVolumeByMuscle, workoutDaysMap, currentStreak, prCountsBySession, trainingInsights } from '../db/repositories/statsRepo';
import type { TrainingInsights } from '../db/repositories/statsRepo';
import { useUnit } from '../contexts/UnitContext';
import { useColors, ThemeColors } from '../contexts/ThemeContext';
import CalendarHeatmap from '../components/CalendarHeatmap';
import VolumeChart from '../components/VolumeChart';
import type { HistoryItem, OverallStats, MuscleVolumeRow, HistoryStackParamList } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryHome'>;

export default function HistoryScreen({ navigation }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [volumeData, setVolumeData] = useState<MuscleVolumeRow[]>([]);
  const [heatmapDays, setHeatmapDays] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [prCounts, setPrCounts] = useState<Record<number, number>>({});
  const [insights, setInsights] = useState<TrainingInsights | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionsExpanded, setSessionsExpanded] = useState(false);
  const { unit } = useUnit();
  const c = useColors();

  const loadData = useCallback(async () => {
    try {
      // Run queries sequentially to avoid concurrent prepareAsync issues in expo-sqlite
      const hist = await listHistory();
      const ov = await overallStats();
      const vol = await weeklyVolumeByMuscle();
      const days = await workoutDaysMap();
      const str = await currentStreak();
      const prc = await prCountsBySession();
      const ins = await trainingInsights();
      setItems(hist);
      setStats(ov);
      setVolumeData(vol);
      setHeatmapDays(days);
      setStreak(str);
      setPrCounts(prc);
      setInsights(ins);
    } catch (err) {
      console.error('Failed to load history data:', err);
      Alert.alert('Error', 'Could not load workout history. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) return `${daysDiff} days ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const header = (
    <View style={styles.headerContainer}>
      <Text style={[styles.pageTitle, { color: c.text }]}>Workout History</Text>

      {/* Calendar Heatmap */}
      {Object.keys(heatmapDays).length > 0 && (
        <CalendarHeatmap workoutDays={heatmapDays} streak={streak} />
      )}

      {/* Compact stats strip */}
      <View style={[styles.statsStrip, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: c.text }]}>{stats?.totalSessions ?? 0}</Text>
          <Text style={[styles.stripLabel, { color: c.textSecondary }]}>Workouts</Text>
        </View>
        <View style={[styles.stripDivider, { backgroundColor: c.border }]} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: c.text }]}>{stats?.last7?.sessionsCount ?? 0}</Text>
          <Text style={[styles.stripLabel, { color: c.textSecondary }]}>This Week</Text>
        </View>
        <View style={[styles.stripDivider, { backgroundColor: c.border }]} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: c.text }]}>{stats?.last7?.setsCount ?? 0}</Text>
          <Text style={[styles.stripLabel, { color: c.textSecondary }]}>Sets (7d)</Text>
        </View>
        <View style={[styles.stripDivider, { backgroundColor: c.border }]} />
        <View style={styles.stripItem}>
          <Text style={[styles.stripValue, { color: c.text }]}>
            {(stats?.last7?.totalVolume ?? 0) >= 1000
              ? `${((stats?.last7?.totalVolume ?? 0) / 1000).toFixed(1)}k`
              : (stats?.last7?.totalVolume ?? 0).toFixed(0)}
          </Text>
          <Text style={[styles.stripLabel, { color: c.textSecondary }]}>Vol ({unit})</Text>
        </View>
      </View>

      {/* Weekly Volume Chart */}
      {volumeData.length > 0 && (
        <View style={[styles.volumeSection, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>7-Day Volume by Muscle</Text>
          <VolumeChart data={volumeData.map(v => ({ muscle: v.muscle, sets: v.sets, volume: v.volume }))} unit={unit} />
        </View>
      )}

      {/* Training Insights */}
      {insights && insights.muscleBreakdown.length > 0 && (
        <InsightsPanel insights={insights} unit={unit} c={c} />
      )}

      {items.length > 0 && (
        <Pressable
          onPress={() => setSessionsExpanded(prev => !prev)}
          style={styles.sectionHeaderRow}
        >
          <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Sessions</Text>
          <Text style={[styles.expandToggle, { color: c.textSecondary }]}>
            {sessionsExpanded ? 'Show Less ▲' : `Show All (${items.length}) ▼`}
          </Text>
        </Pressable>
      )}
    </View>
  );

  const visibleItems = sessionsExpanded ? items : items.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlashList
        data={visibleItems}
        keyExtractor={(item) => String(item.id)}
        estimatedItemSize={160}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No workouts yet</Text>
            <Text style={[styles.emptyBody, { color: c.textSecondary }]}>Start your first session to see it here!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
            style={[styles.sessionCard, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={styles.sessionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.sessionTitle, { color: c.text }]}>{item.template_name || 'Workout'}</Text>
                  {prCounts[item.id] > 0 && (
                    <View style={[styles.prBadge, { backgroundColor: c.warningBg, borderColor: c.warning }]}>
                      <Text style={[styles.prBadgeText, { color: c.warningText }]}>🏆 {prCounts[item.id]}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sessionDate, { color: c.textSecondary }]}>{formatDate(item.performed_at)}</Text>
              </View>
              <View style={[styles.durationBadge, { backgroundColor: c.success }]}>
                <Text style={[styles.durationText, { color: '#FFF' }]}>
                  {formatDuration(item.created_at, item.performed_at)}
                </Text>
              </View>
            </View>

            {item.notes ? (
              <Text style={[styles.sessionNotes, { color: c.textSecondary, borderTopColor: c.border }]} numberOfLines={2}>
                📝 {item.notes}
              </Text>
            ) : null}

            {item.exercises && (
              <View style={[styles.exercisesRow, { borderTopColor: c.border }]}>
                <Text style={[styles.exercisesLabel, { color: c.textSecondary }]}>Exercises:</Text>
                <Text style={[styles.exercisesText, { color: c.textSecondary }]} numberOfLines={2}>
                  {item.exercises}
                </Text>
              </View>
            )}

            <View style={[styles.sessionStats, { borderTopColor: c.border }]}>
              <View style={styles.sessionStatItem}>
                <Text style={styles.sessionStatIcon}>✓</Text>
                <Text style={[styles.sessionStatText, { color: c.textSecondary }]}>
                  {item.completed_sets_count}/{item.sets_count} sets
                </Text>
              </View>
              <View style={[styles.sessionStatDivider, { backgroundColor: c.border }]} />
              <View style={styles.sessionStatItem}>
                <Text style={styles.sessionStatIcon}>📦</Text>
                <Text style={[styles.sessionStatText, { color: c.textSecondary }]}>
                  {Number(item.total_volume).toFixed(0)} {unit}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          !sessionsExpanded && items.length > 3 ? (
            <Pressable onPress={() => setSessionsExpanded(true)} style={[styles.showMoreBtn, { borderColor: c.border }]}>
              <Text style={[styles.showMoreText, { color: c.accent }]}>
                Show {items.length - 3} more sessions
              </Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
 *  Insights Panel — body focus, balance, patterns
 * ═══════════════════════════════════════════════════════════ */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest', lats: 'Lats', 'mid back': 'Mid Back', 'lower back': 'Lower Back',
  'shoulders front': 'Front Delts', 'shoulders side': 'Side Delts',
  'shoulders rear': 'Rear Delts', 'rear delt': 'Rear Delts', shoulders: 'Shoulders',
  quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves',
  biceps: 'Biceps', triceps: 'Triceps', core: 'Core', traps: 'Traps',
  forearms: 'Forearms', adductors: 'Adductors', tibialis: 'Tibialis',
  'rotator cuff': 'Rotator Cuff',
};

function muscleLabel(m: string) {
  return MUSCLE_LABELS[m] || m.charAt(0).toUpperCase() + m.slice(1);
}

function InsightsPanel({ insights, unit, c }: { insights: TrainingInsights; unit: string; c: ThemeColors }) {
  const { balance, muscleBreakdown, topExercises, avgSessionsPerWeek, favoriteDayOfWeek, neglectedMuscles, weeklyVolumeTrend } = insights;
  const is = insightStyles(c);

  // Determine dominant category
  const categories = [
    { label: 'Push', sets: balance.push },
    { label: 'Pull', sets: balance.pull },
    { label: 'Legs', sets: balance.legs },
  ].sort((a, b) => b.sets - a.sets);
  const dominant = categories[0];
  const weakest = categories[2];
  const imbalanceRatio = dominant.sets > 0 && weakest.sets > 0
    ? Math.round((dominant.sets / weakest.sets) * 10) / 10
    : 0;

  // Volume trend direction
  const recentWeeks = weeklyVolumeTrend.slice(-4);
  const olderWeeks = weeklyVolumeTrend.slice(-8, -4);
  const recentAvg = recentWeeks.length > 0 ? recentWeeks.reduce((s, w) => s + w.volume, 0) / recentWeeks.length : 0;
  const olderAvg = olderWeeks.length > 0 ? olderWeeks.reduce((s, w) => s + w.volume, 0) / olderWeeks.length : 0;
  const volumeTrendPct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : null;

  const maxSets = muscleBreakdown.length > 0 ? muscleBreakdown[0].sets : 1;
  const showMuscles = muscleBreakdown.slice(0, 8);

  return (
    <View style={is.container}>
      <Text style={is.title}>Training Insights</Text>

      {/* Body Focus — horizontal bars */}
      <View style={is.card}>
        <Text style={is.cardTitle}>🎯 Body Focus</Text>
        <Text style={is.cardSubtitle}>All-time sets by muscle group</Text>
        {showMuscles.map((m) => (
          <View key={m.muscle} style={is.barRow}>
            <Text style={is.barLabel}>{muscleLabel(m.muscle)}</Text>
            <View style={is.barTrack}>
              <View style={[is.barFill, { width: `${(m.sets / maxSets) * 100}%` }]} />
            </View>
            <Text style={is.barValue}>{m.sets} ({m.pct}%)</Text>
          </View>
        ))}
        {muscleBreakdown.length > 8 && (
          <Text style={is.moreText}>+{muscleBreakdown.length - 8} more muscle groups</Text>
        )}
      </View>

      {/* Push / Pull / Legs Balance */}
      {balance.total > 0 && (
        <View style={is.card}>
          <Text style={is.cardTitle}>⚖️ Training Balance</Text>
          <View style={is.balanceBar}>
            {balance.push > 0 && (
              <View style={[is.balanceSegment, { flex: balance.push, backgroundColor: '#E8443A' }]} />
            )}
            {balance.pull > 0 && (
              <View style={[is.balanceSegment, { flex: balance.pull, backgroundColor: '#4A90D9' }]} />
            )}
            {balance.legs > 0 && (
              <View style={[is.balanceSegment, { flex: balance.legs, backgroundColor: '#2EA043' }]} />
            )}
            {balance.core > 0 && (
              <View style={[is.balanceSegment, { flex: balance.core, backgroundColor: '#FDCB6E' }]} />
            )}
          </View>
          <View style={is.balanceLegend}>
            <View style={is.legendItem}>
              <View style={[is.legendDot, { backgroundColor: '#E8443A' }]} />
              <Text style={is.legendText}>Push {balance.total > 0 ? Math.round((balance.push / balance.total) * 100) : 0}%</Text>
            </View>
            <View style={is.legendItem}>
              <View style={[is.legendDot, { backgroundColor: '#4A90D9' }]} />
              <Text style={is.legendText}>Pull {balance.total > 0 ? Math.round((balance.pull / balance.total) * 100) : 0}%</Text>
            </View>
            <View style={is.legendItem}>
              <View style={[is.legendDot, { backgroundColor: '#2EA043' }]} />
              <Text style={is.legendText}>Legs {balance.total > 0 ? Math.round((balance.legs / balance.total) * 100) : 0}%</Text>
            </View>
            {balance.core > 0 && (
              <View style={is.legendItem}>
                <View style={[is.legendDot, { backgroundColor: '#FDCB6E' }]} />
                <Text style={is.legendText}>Core {Math.round((balance.core / balance.total) * 100)}%</Text>
              </View>
            )}
          </View>
          {imbalanceRatio >= 2 && (
            <View style={[is.insightBadge, { backgroundColor: c.isDark ? '#3A2A00' : '#FFF8E1', borderColor: c.isDark ? '#806000' : '#FFD54F' }]}>
              <Text style={[is.insightText, { color: c.isDark ? '#FFD54F' : '#E65100' }]}>
                ⚠️ {dominant.label} dominates at {imbalanceRatio}× more than {weakest.label} — consider adding more {weakest.label.toLowerCase()} work
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Quick Insights */}
      <View style={is.card}>
        <Text style={is.cardTitle}>📊 Patterns</Text>
        {avgSessionsPerWeek > 0 && (
          <View style={is.insightRow}>
            <Text style={is.insightIcon}>📅</Text>
            <Text style={is.insightLabel}>
              You train <Text style={is.bold}>{avgSessionsPerWeek}× per week</Text> on average
              {favoriteDayOfWeek != null ? `, mostly on ${DAY_NAMES[favoriteDayOfWeek]}s` : ''}
            </Text>
          </View>
        )}
        {topExercises.length > 0 && (
          <View style={is.insightRow}>
            <Text style={is.insightIcon}>🏆</Text>
            <Text style={is.insightLabel}>
              Go-to lifts: <Text style={is.bold}>{topExercises.slice(0, 3).map(e => e.name).join(', ')}</Text>
            </Text>
          </View>
        )}
        {volumeTrendPct != null && (
          <View style={is.insightRow}>
            <Text style={is.insightIcon}>{volumeTrendPct >= 0 ? '📈' : '📉'}</Text>
            <Text style={is.insightLabel}>
              Weekly volume is <Text style={is.bold}>{volumeTrendPct >= 0 ? 'up' : 'down'} {Math.abs(volumeTrendPct)}%</Text> vs prior 4 weeks
            </Text>
          </View>
        )}
        {neglectedMuscles.length > 0 && (
          <View style={is.insightRow}>
            <Text style={is.insightIcon}>👀</Text>
            <Text style={is.insightLabel}>
              Haven't trained in 30 days: <Text style={is.bold}>{neglectedMuscles.map(muscleLabel).join(', ')}</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const insightStyles = (c: ThemeColors) => StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 12 },
  card: {
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: c.textSecondary, marginBottom: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { width: 80, fontSize: 12, fontWeight: '600', color: c.textSecondary },
  barTrack: {
    flex: 1,
    height: 14,
    backgroundColor: c.isDark ? '#2A2A2A' : '#F0EDE8',
    borderRadius: 7,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: { height: '100%', backgroundColor: c.accent, borderRadius: 7, minWidth: 4 },
  barValue: { width: 65, fontSize: 11, color: c.textSecondary, textAlign: 'right' },
  moreText: { fontSize: 11, color: c.textSecondary, marginTop: 4, textAlign: 'center' },
  balanceBar: {
    flexDirection: 'row',
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    marginVertical: 10,
    gap: 2,
  },
  balanceSegment: { borderRadius: 9 },
  balanceLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: c.textSecondary, fontWeight: '600' },
  insightBadge: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  insightText: { fontSize: 12, fontWeight: '600' },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  insightIcon: { fontSize: 16, marginTop: 1 },
  insightLabel: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  bold: { fontWeight: '700', color: c.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },

  // Compact stats strip
  statsStrip: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
  },
  stripValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  stripLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  stripDivider: {
    width: 1,
    height: 28,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  expandToggle: {
    fontSize: 13,
    fontWeight: '600',
  },
  showMoreBtn: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Session Cards
  sessionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },

  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  sessionHeaderLeft: {
    flex: 1,
  },

  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  sessionDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },

  durationBadge: {
    backgroundColor: '#1A7F37',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },

  exercisesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  exercisesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginRight: 6,
    paddingTop: 1,
  },

  exercisesText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },

  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  sessionStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sessionStatIcon: {
    fontSize: 14,
    marginRight: 6,
  },

  sessionStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },

  sessionStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
  },

  // Volume section
  volumeSection: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },

  // PR badge
  prBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F5D76E',
  },
  prBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8860B',
  },

  // Empty State
  empty: {
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },

  emptyBody: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  sessionNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
  },
});
