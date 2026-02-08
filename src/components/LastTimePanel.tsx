import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../contexts/ThemeContext';

export default function LastTimePanel({
  data,
}: {
  data: { performed_at: string; sets: any[] } | null;
}) {
  const c = useColors();
  if (!data) return null;
  return (
    <View style={[styles.container, { backgroundColor: c.sectionHeaderBg, borderColor: c.border, borderWidth: 1 }]}>
      <Text style={[styles.title, { color: c.textSecondary }]}>Last time</Text>
      <Text style={[styles.date, { color: c.textTertiary }]}>{new Date(data.performed_at).toLocaleDateString()}</Text>
      {data.sets.map((s, i) => (
        <Text key={i} style={[styles.set, { color: c.textSecondary }]}>
          {s.weight} × {s.reps}{s.rpe ? ` @${s.rpe}` : ''}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F6F4F1',
    borderRadius: 8,
  },
  title: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 2 },
  date: { fontSize: 12, color: '#AAA', marginBottom: 4 },
  set: { fontSize: 14, color: '#555' },
});
