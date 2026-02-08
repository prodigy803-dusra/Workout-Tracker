import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { listHistory } from '../db/repositories/sessionsRepo';
import { overallStats } from '../db/repositories/statsRepo';

export default function HistoryScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalSessions: number; last7: any } | null>(null);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      listHistory().then(setItems);
      overallStats().then(setStats);
    });
    return unsub;
  }, [navigation]);

  const header = (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Overview</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats?.totalSessions ?? 0}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats?.last7?.sessionsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Last 7 Days</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats?.last7?.setsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Sets (7d)</Text>
        </View>
      </View>
      {(stats?.last7?.totalVolume ?? 0) > 0 && (
        <Text style={styles.volumeText}>
          7-day volume: {Number(stats?.last7?.totalVolume ?? 0).toFixed(0)}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={items}
        keyExtractor={(item) => String(item.id)}
        estimatedItemSize={72}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>Complete a workout to see it here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
            style={styles.row}
          >
            <Text style={styles.rowTitle}>
              {item.template_name || 'Session'}
            </Text>
            <Text style={styles.rowDate}>{new Date(item.performed_at).toLocaleString()}</Text>
            <Text style={styles.rowMeta}>
              {item.slots_count} slots · {item.sets_count} sets · Vol: {Number(item.total_volume ?? 0).toFixed(0)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  statsCard: {
    margin: 16,
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  statsTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  volumeText: { marginTop: 8, textAlign: 'center', color: '#555', fontSize: 13 },
  empty: { paddingHorizontal: 16, paddingVertical: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  emptyBody: { marginTop: 4, color: '#666' },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  rowDate: { fontSize: 13, color: '#888', marginTop: 2 },
  rowMeta: { fontSize: 13, color: '#555', marginTop: 2 },
});
