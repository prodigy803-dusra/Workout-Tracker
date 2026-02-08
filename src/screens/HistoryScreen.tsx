import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { listHistory } from '../db/repositories/sessionsRepo';
import { overallStats } from '../db/repositories/statsRepo';
import { useUnit } from '../contexts/UnitContext';

export default function HistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalSessions: number; last7: any } | null>(null);
  const { unit } = useUnit();

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      listHistory().then(setItems);
      overallStats().then(setStats);
    });
    return unsub;
  }, [navigation]);

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
      <Text style={styles.pageTitle}>Workout History</Text>
      
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>💪</Text>
          </View>
          <Text style={styles.statValue}>{stats?.totalSessions ?? 0}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>🔥</Text>
          </View>
          <Text style={styles.statValue}>{stats?.last7?.sessionsCount ?? 0}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>📊</Text>
          </View>
          <Text style={styles.statValue}>{stats?.last7?.setsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Sets (7d)</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Text style={styles.statIcon}>⚡</Text>
          </View>
          <Text style={styles.statValue}>
            {(stats?.last7?.totalVolume ?? 0) >= 1000
              ? `${((stats?.last7?.totalVolume ?? 0) / 1000).toFixed(1)}k`
              : (stats?.last7?.totalVolume ?? 0).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Volume ({unit})</Text>
        </View>
      </View>

      {items.length > 0 && <Text style={styles.sectionTitle}>Recent Sessions</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={items}
        keyExtractor={(item) => String(item.id)}
        estimatedItemSize={140}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptyBody}>Start your first session to see it here!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
            style={styles.sessionCard}
          >
            <View style={styles.sessionHeader}>
              <View style={styles.sessionHeaderLeft}>
                <Text style={styles.sessionTitle}>{item.template_name || 'Workout'}</Text>
                <Text style={styles.sessionDate}>{formatDate(item.performed_at)}</Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  {formatDuration(item.created_at, item.performed_at)}
                </Text>
              </View>
            </View>

            {item.exercises && (
              <View style={styles.exercisesRow}>
                <Text style={styles.exercisesLabel}>Exercises:</Text>
                <Text style={styles.exercisesText} numberOfLines={2}>
                  {item.exercises}
                </Text>
              </View>
            )}

            <View style={styles.sessionStats}>
              <View style={styles.sessionStatItem}>
                <Text style={styles.sessionStatIcon}>✓</Text>
                <Text style={styles.sessionStatText}>
                  {item.completed_sets_count}/{item.sets_count} sets
                </Text>
              </View>
              <View style={styles.sessionStatDivider} />
              <View style={styles.sessionStatItem}>
                <Text style={styles.sessionStatIcon}>📦</Text>
                <Text style={styles.sessionStatText}>
                  {Number(item.total_volume).toFixed(0)} {unit}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

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

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },

  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  statIcon: {
    fontSize: 24,
  },

  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 12,
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
});
