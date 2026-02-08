import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getSessionDetail } from '../db/repositories/sessionsRepo';
import type { SessionDetail } from '../types';

export default function SessionDetailScreen({ route }: any) {
  const { sessionId } = route.params;
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  useEffect(() => {
    getSessionDetail(sessionId).then(setDetail);
  }, [sessionId]);

  if (!detail) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {detail.session.template_name || 'Session'}
      </Text>
      <Text style={styles.date}>{new Date(detail.session.performed_at).toLocaleString()}</Text>
      {detail.session.notes ? <Text style={styles.notes}>{detail.session.notes}</Text> : null}

      {detail.slots.map((slot: any) => {
        const sets = detail.sets.filter(
          (s: any) => s.session_slot_choice_id === slot.session_slot_choice_id
        );
        return (
          <View key={slot.session_slot_id} style={styles.slotCard}>
            <Text style={styles.slotTitle}>
              {slot.exercise_name}
              {slot.option_name ? ` (${slot.option_name})` : ''}
            </Text>
            {slot.name && <Text style={styles.slotName}>{slot.name}</Text>}
            {sets.map((s: any) => (
              <View key={s.id} style={styles.setRow}>
                <Text style={styles.setIndex}>#{s.set_index}</Text>
                <Text style={styles.setText}>
                  {s.weight} × {s.reps}
                </Text>
                {s.rpe != null && <Text style={styles.rpeText}>@{s.rpe}</Text>}
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
