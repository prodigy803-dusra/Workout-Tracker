import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getSessionDetail } from '../db/repositories/sessionsRepo';
import { getSessionPRs } from '../db/repositories/statsRepo';
import { useColors } from '../contexts/ThemeContext';
import type { SessionDetail } from '../types';

type SessionPR = {
  id: number;
  exercise_id: number;
  exercise_name: string;
  pr_type: string;
  value: number;
  previous_value: number | null;
};

export default function SessionDetailScreen({ route }: any) {
  const { sessionId } = route.params;
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [prs, setPrs] = useState<SessionPR[]>([]);
  const c = useColors();

  useEffect(() => {
    getSessionDetail(sessionId).then(setDetail);
    getSessionPRs(sessionId).then(setPrs);
  }, [sessionId]);

  if (!detail) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>
        {detail.session.template_name || 'Session'}
      </Text>
      <Text style={[styles.date, { color: c.textSecondary }]}>{new Date(detail.session.performed_at).toLocaleString()}</Text>
      {detail.session.notes ? <Text style={[styles.notes, { color: c.textSecondary }]}>{detail.session.notes}</Text> : null}

      {prs.length > 0 && (
        <View style={[styles.prSection, { backgroundColor: '#FFF8E1', borderColor: '#F5D76E' }]}>
          <Text style={styles.prTitle}>🏆 Personal Records</Text>
          {prs.map((pr) => (
            <View key={pr.id} style={styles.prRow}>
              <Text style={styles.prText}>
                {pr.exercise_name ?? `Exercise #${pr.exercise_id}`} — {pr.pr_type === 'e1rm' ? 'e1RM' : 'Weight'}: {pr.value.toFixed(1)}
                {pr.previous_value ? ` (prev: ${pr.previous_value.toFixed(1)})` : ' (first!)'}
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
            {sets.map((s: any) => (
              <View key={s.id} style={styles.setRow}>
                <Text style={[styles.setIndex, { color: c.textTertiary }]}>#{s.set_index}</Text>
                <Text style={[styles.setText, { color: c.text }]}>
                  {s.weight} × {s.reps}
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
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F4F1' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  date: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 4 },
  notes: { fontSize: 14, color: '#555', marginTop: 4, fontStyle: 'italic' },
  prSection: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  prTitle: { fontSize: 16, fontWeight: '700', color: '#B8860B', marginBottom: 6 },
  prRow: { paddingVertical: 3 },
  prText: { fontSize: 14, color: '#7A6B00' },
  slotCard: {
    marginTop: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  slotTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  slotName: { fontSize: 13, color: '#888', marginBottom: 6 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  setIndex: { width: 28, fontSize: 13, color: '#AAA' },
  setText: { fontSize: 15, fontWeight: '600', color: '#333' },
  rpeText: { fontSize: 13, color: '#888' },
});
