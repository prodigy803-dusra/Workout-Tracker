import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { getSessionDetail } from '../db/repositories/sessionsRepo';
import { getSessionPRs } from '../db/repositories/statsRepo';
import { useColors } from '../contexts/ThemeContext';
import { useUnit } from '../contexts/UnitContext';
import { formatWeight } from '../utils/units';
import type { SessionDetail, DropSetSegment, HistoryStackParamList } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type SessionPR = {
  id: number;
  exercise_id: number;
  exercise_name: string;
  pr_type: string;
  value: number;
  previous_value: number | null;
};

type Props = NativeStackScreenProps<HistoryStackParamList, 'SessionDetail'>;

export default function SessionDetailScreen({ route }: Props) {
  const { sessionId } = route.params;
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [prs, setPrs] = useState<SessionPR[]>([]);
  const [error, setError] = useState<string | null>(null);
  const c = useColors();
  const { unit } = useUnit();

  useEffect(() => {
    (async () => {
      try {
        const d = await getSessionDetail(sessionId);
        const p = await getSessionPRs(sessionId);
        setDetail(d);
        setPrs(p);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [sessionId]);

  if (error) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8 }}>Error loading session</Text>
      <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center' }}>{error}</Text>
    </View>
  );

  if (!detail) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <ActivityIndicator size="large" color={c.accent} />
    </View>
  );

  // Group drops by set_id for easy lookup
  const dropsBySet: Record<number, DropSetSegment[]> = {};
  if (detail.drops) {
    for (const d of detail.drops) {
      if (!dropsBySet[d.set_id]) dropsBySet[d.set_id] = [];
      dropsBySet[d.set_id].push(d);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>
        {detail.session.template_name || 'Session'}
      </Text>
      <Text style={[styles.date, { color: c.textSecondary }]}>{new Date(detail.session.performed_at).toLocaleString()}</Text>
      {detail.session.notes ? <Text style={[styles.notes, { color: c.textSecondary }]}>{detail.session.notes}</Text> : null}

      {prs.length > 0 && (
        <View style={[styles.prSection, { backgroundColor: c.warningBg, borderColor: c.warning }]}>
          <Text style={[styles.prTitle, { color: c.warningText }]}>🏆 Personal Records</Text>
          {prs.map((pr) => (
            <View key={pr.id} style={styles.prRow}>
              <Text style={[styles.prText, { color: c.warningText }]}>
                {pr.exercise_name ?? `Exercise #${pr.exercise_id}`} — {pr.pr_type === 'e1rm' ? 'e1RM' : 'Weight'}: {formatWeight(pr.value, unit)} {unit}
                {pr.previous_value ? ` (prev: ${formatWeight(pr.previous_value, unit)})` : ' (first!)'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {detail.slots.map((slot: any) => {
        const sets = detail.sets.filter(
          (s: any) => s.session_slot_choice_id === slot.session_slot_choice_id
        );
        return (
          <View key={slot.session_slot_id} style={[styles.slotCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.slotTitle, { color: c.text }]}>
              {slot.exercise_name}
              {slot.option_name ? ` (${slot.option_name})` : ''}
            </Text>
            {slot.name && <Text style={[styles.slotName, { color: c.textSecondary }]}>{slot.name}</Text>}
            {sets.map((s: any) => {
              const setDrops = dropsBySet[s.id] || [];
              return (
                <React.Fragment key={s.id}>
                  <View style={[styles.setRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.setIndex, { color: c.textTertiary }]}>#{s.set_index}</Text>
                    <Text style={[styles.setText, { color: c.text }]}>
                      {formatWeight(s.weight, unit)} {unit} × {s.reps}
                    </Text>
                    {s.rpe != null && (
                      <Text
                        style={[
                          styles.rpeText,
                          {
                            color: s.rpe <= 7 ? c.success : s.rpe <= 8.5 ? (c.isDark ? c.warning : '#B8860B') : c.danger,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        @{s.rpe}
                      </Text>
                    )}
                    {s.is_warmup ? (
                      <View style={[styles.warmupBadge, { backgroundColor: c.accentBg, borderColor: c.accent }]}>
                        <Text style={[styles.warmupBadgeText, { color: c.accent }]}>W</Text>
                      </View>
                    ) : null}
                  </View>
                  {/* Drop-set segments */}
                  {setDrops.map((d) => (
                    <View key={d.id} style={[styles.dropRow, { borderBottomColor: c.border }]}>
                      <Text style={[styles.dropArrow, { color: c.textTertiary }]}>↳</Text>
                      <Text style={[styles.dropText, { color: c.textSecondary }]}>
                        {formatWeight(d.weight, unit)} {unit} × {d.reps}
                      </Text>
                    </View>
                  ))}
                </React.Fragment>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 2, marginBottom: 4 },
  notes: { fontSize: 14, marginTop: 4, fontStyle: 'italic' },
  prSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  prTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  prRow: { paddingVertical: 3 },
  prText: { fontSize: 14 },
  slotCard: {
    marginTop: 14,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  slotTitle: { fontSize: 16, fontWeight: '700' },
  slotName: { fontSize: 13, marginBottom: 6 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  setIndex: { width: 28, fontSize: 13 },
  setText: { fontSize: 15, fontWeight: '600', flex: 1 },
  rpeText: { fontSize: 13 },
  warmupBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  warmupBadgeText: { fontSize: 11, fontWeight: '700' },
  dropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 38,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropArrow: { fontSize: 14 },
  dropText: { fontSize: 14 },
});
