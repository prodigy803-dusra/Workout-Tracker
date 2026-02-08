import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, StyleSheet } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { resetDb, executeSqlAsync } from '../db/db';
import { importExercises } from '../db/repositories/exercisesRepo';
import { useUnit } from '../contexts/UnitContext';

export default function SettingsScreen() {
  const [json, setJson] = useState('');
  const [resetting, setResetting] = useState(false);
  const { unit, setUnit } = useUnit();

  async function exportJson() {
    try {
      const sessions = await executeSqlAsync(`SELECT * FROM sessions WHERE status='final';`);
      const sets = await executeSqlAsync(`SELECT * FROM sets;`);
      const templates = await executeSqlAsync(`SELECT * FROM templates;`);
      const exercises = await executeSqlAsync(`SELECT * FROM exercises;`);
      const exerciseOptions = await executeSqlAsync(`SELECT * FROM exercise_options;`);

      const payload = {
        exportedAt: new Date().toISOString(),
        sessions: sessions.rows._array,
        sets: sets.rows._array,
        templates: templates.rows._array,
        exercises: exercises.rows._array,
        exercise_options: exerciseOptions.rows._array,
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      if (await Sharing.isAvailableAsync()) {
        const file = new File(Paths.cache, 'export.json');
        file.write(jsonStr);
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert('Sharing not available', 'Your device does not support file sharing.');
      }
    } catch (e) {
      Alert.alert('Export Error', 'Could not export data.');
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
