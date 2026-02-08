import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { resetDb, executeSqlAsync } from '../db/db';
import { importExercises } from '../db/repositories/exercisesRepo';
import { useUnit } from '../contexts/UnitContext';

export default function SettingsScreen() {
  const [json, setJson] = useState('');
  const [resetting, setResetting] = useState(false);
  const { unit, setUnit } = useUnit();

  async function exportJson() {
    const data = await executeSqlAsync(
      `SELECT 'sessions' as type, json_group_array(json_object(
        'id', id, 'performed_at', performed_at, 'notes', notes, 'status', status, 'template_id', template_id, 'created_at', created_at
      )) as payload FROM sessions;`
    );
    const payload = {
      sessions: JSON.parse(data.rows.item(0).payload || '[]'),
    };
    const path = `${FileSystem.documentDirectory}export.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path);
    }
  }

  async function importJson() {
    try {
      const parsed = JSON.parse(json);
      await importExercises(parsed);
      setJson('');
      Alert.alert('Success', 'Exercises imported successfully.');
    } catch (e) {
      Alert.alert('Error', 'Invalid JSON');
    }
  }

  function handleReset() {
    Alert.alert(
      'Reset Database',
      'This will delete ALL your data and re-seed. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetDb();
              Alert.alert('Done', 'Database has been reset and re-seeded.');
            } catch (e) {
              Alert.alert('Error', 'Reset failed.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Unit</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {(['kg', 'lb'] as const).map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            style={[
              styles.button,
              u === unit ? {} : { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
              { flex: 1 },
            ]}
          >
            <Text style={[styles.buttonText, u !== unit && { color: '#111' }]}>
              {u.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Data</Text>

      <Pressable onPress={exportJson} style={styles.button}>
        <Text style={styles.buttonText}>Export JSON</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Import Exercises</Text>
      <TextInput
        value={json}
        onChangeText={setJson}
        placeholder='{"exercises":[{"name":"Row","options":["Barbell"]}]}'
        multiline
        style={styles.textArea}
      />
      <Pressable onPress={importJson} style={styles.button}>
        <Text style={styles.buttonText}>Import</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Danger Zone</Text>
      <Pressable
        onPress={handleReset}
        style={[styles.button, styles.dangerButton]}
        disabled={resetting}
      >
        <Text style={[styles.buttonText, styles.dangerText]}>
          {resetting ? 'Resetting...' : 'Reset Database'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F4F1' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  button: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  dangerButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#C00' },
  dangerText: { color: '#C00' },
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    height: 120,
    backgroundColor: '#FFF',
    marginBottom: 8,
    textAlignVertical: 'top',
  },
});
