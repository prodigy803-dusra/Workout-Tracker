import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { listExercises, createExercise } from '../db/repositories/exercisesRepo';

export default function ExercisesScreen({ navigation }: any) {
  const [ex, setEx] = useState<any[]>([]);
  const [newName, setNewName] = useState('');

  function load() {
    listExercises().then(setEx);
  }

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    await createExercise(name);
    setNewName('');
    load();
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={ex}
        keyExtractor={(item) => String(item.id)}
        estimatedItemSize={60}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.newRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="New exercise name"
                style={styles.input}
              />
              <Pressable style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id, name: item.name })}
            style={styles.row}
          >
            <Text style={styles.rowText}>{item.name}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  header: { padding: 16, paddingBottom: 8 },
  newRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  createBtnText: { color: '#FFF', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  rowText: { fontSize: 16, color: '#1A1A1A' },
  chevron: { fontSize: 22, color: '#BBB' },
});
