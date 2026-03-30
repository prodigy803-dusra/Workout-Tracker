/**
 * PRWallScreen — all-time personal records per exercise.
 * Shows best e1RM, heaviest weight, and best volume for each exercise
 * the user has ever performed in a finalized session.
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { allTimePRs } from '../db/repositories/statsRepo';
import type { PRWallEntry } from '../db/repositories/statsRepo';
import { useColors, ThemeColors } from '../contexts/ThemeContext';
import { useUnit } from '../contexts/UnitContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'PRWall'>;

type SortKey = 'name' | 'e1rm' | 'weight' | 'volume' | 'sessions';

export default function PRWallScreen({ navigation }: Props) {
  const [data, setData] = useState<PRWallEntry[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('e1rm');
  const c = useColors();
  const { unit } = useUnit();

  const loadData = useCallback(async () => {
    const prs = await allTimePRs();
    setData(prs);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let items = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p => p.exercise_name.toLowerCase().includes(q));
    }
    items = [...items].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.exercise_name.localeCompare(b.exercise_name);
        case 'e1rm': return (b.best_e1rm ?? 0) - (a.best_e1rm ?? 0);
        case 'weight':
          if (a.is_assisted && b.is_assisted) return (a.best_weight ?? Infinity) - (b.best_weight ?? Infinity);
          return (b.best_weight ?? 0) - (a.best_weight ?? 0);
        case 'volume': return (b.best_volume ?? 0) - (a.best_volume ?? 0);
        case 'sessions': return b.session_count - a.session_count;
        default: return 0;
      }
    });
    return items;
  }, [data, search, sortBy]);

  const s = makeStyles(c);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const formatWeight = (w: number | null) => {
    if (w == null) return '—';
    return w % 1 === 0 ? `${w}` : `${w.toFixed(1)}`;
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'e1rm', label: 'e1RM' },
    { key: 'weight', label: 'Weight' },
    { key: 'volume', label: 'Volume' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'name', label: 'A–Z' },
  ];

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      {/* Search */}
      <View style={s.searchRow}>
        <TextInput
          style={[s.searchInput, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
          placeholder="Search exercises..."
          placeholderTextColor={c.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      {/* Sort chips */}
      <View style={s.sortRow}>
        {sortOptions.map(opt => (
          <Pressable
            key={opt.key}
            onPress={() => setSortBy(opt.key)}
            style={[s.sortChip, sortBy === opt.key && { backgroundColor: c.accent }]}
          >
            <Text style={[s.sortChipText, sortBy === opt.key && { color: '#FFF' }]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlashList
        data={filtered}
        keyExtractor={item => String(item.exercise_id)}
        renderItem={({ item }) => (
          <Pressable
            style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}
            onPress={() => (navigation as any).navigate('Exercises', {
              screen: 'ExerciseDetail',
              params: { exerciseId: item.exercise_id, name: item.exercise_name },
            })}
          >
            <View style={s.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[s.exerciseName, { color: c.text }]}>{item.exercise_name}</Text>
                {item.primary_muscle && (
                  <Text style={[s.muscleBadge, { color: c.textSecondary }]}>
                    {item.primary_muscle.charAt(0).toUpperCase() + item.primary_muscle.slice(1)}
                    {item.is_assisted ? ' • Assisted' : ''}
                  </Text>
                )}
              </View>
              <View style={[s.sessionsBadge, { backgroundColor: c.isDark ? '#1A2A1A' : '#E8F5E9' }]}>
                <Text style={[s.sessionsText, { color: c.success }]}>{item.session_count} sessions</Text>
              </View>
            </View>

            <View style={s.statsRow}>
              {/* e1RM */}
              {!item.is_assisted && (
                <View style={s.statBlock}>
                  <Text style={[s.statLabel, { color: c.textTertiary }]}>Est. 1RM</Text>
                  <Text style={[s.statValue, { color: c.text }]}>
                    {formatWeight(item.best_e1rm)} <Text style={s.statUnit}>{unit}</Text>
                  </Text>
                  {item.best_e1rm_date && (
                    <Text style={[s.statDate, { color: c.textTertiary }]}>{formatDate(item.best_e1rm_date)}</Text>
                  )}
                </View>
              )}

              {/* Best weight */}
              <View style={s.statBlock}>
                <Text style={[s.statLabel, { color: c.textTertiary }]}>
                  {item.is_assisted ? 'Least Assist' : 'Heaviest'}
                </Text>
                <Text style={[s.statValue, { color: c.text }]}>
                  {formatWeight(item.best_weight)} <Text style={s.statUnit}>{unit}</Text>
                </Text>
                {item.best_weight_date && (
                  <Text style={[s.statDate, { color: c.textTertiary }]}>{formatDate(item.best_weight_date)}</Text>
                )}
              </View>

              {/* Best volume */}
              <View style={s.statBlock}>
                <Text style={[s.statLabel, { color: c.textTertiary }]}>Best Volume</Text>
                <Text style={[s.statValue, { color: c.text }]}>
                  {item.best_volume != null
                    ? (item.best_volume >= 1000
                      ? `${(item.best_volume / 1000).toFixed(1)}k`
                      : `${Math.round(item.best_volume)}`)
                    : '—'
                  } <Text style={s.statUnit}>{unit}</Text>
                </Text>
                {item.best_volume_date && (
                  <Text style={[s.statDate, { color: c.textTertiary }]}>{formatDate(item.best_volume_date)}</Text>
                )}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={[s.emptyText, { color: c.textSecondary }]}>
              {search ? 'No matching exercises' : 'Complete a workout to see your PRs here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    searchInput: {
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      fontSize: 15,
    },
    sortRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.isDark ? '#2A2A2A' : '#F0EDE8',
    },
    sortChipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    card: {
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    exerciseName: { fontSize: 16, fontWeight: '700' },
    muscleBadge: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    sessionsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    sessionsText: { fontSize: 11, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: 12 },
    statBlock: { flex: 1 },
    statLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
    statValue: { fontSize: 18, fontWeight: '800' },
    statUnit: { fontSize: 12, fontWeight: '500' },
    statDate: { fontSize: 10, fontWeight: '500', marginTop: 1 },
    empty: { paddingVertical: 48, alignItems: 'center' },
    emptyText: { fontSize: 14 },
  });
}
