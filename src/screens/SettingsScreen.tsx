import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Alert, StyleSheet, ScrollView } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { resetDb, executeSqlAsync, db } from '../db/db';
import { importExercises } from '../db/repositories/exercisesRepo';
import { useUnit } from '../contexts/UnitContext';

const BACKUP_TABLES = [
  'exercises',
  'exercise_options',
  'templates',
  'template_slots',
  'template_slot_options',
  'template_prescribed_sets',
  'sessions',
  'session_slots',
  'session_slot_choices',
  'sets',
  'app_settings',
] as const;

export default function SettingsScreen() {
  const [json, setJson] = useState('');
  const [resetting, setResetting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { unit, setUnit } = useUnit();

  async function exportJson() {
    try {
      const payload: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 2 };
      for (const table of BACKUP_TABLES) {
        const res = await executeSqlAsync(`SELECT * FROM ${table};`);
        payload[table] = res.rows._array;
      }
      const jsonStr = JSON.stringify(payload, null, 2);
      if (await Sharing.isAvailableAsync()) {
        const file = new File(Paths.cache, 'workout_backup.json');
        file.write(jsonStr);
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert('Sharing not available', 'Your device does not support file sharing.');
      }
    } catch (e) {
      Alert.alert('Export Error', 'Could not export data.');
    }
  }

  async function restoreBackup() {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.version || parsed.version < 2) {
        // Legacy v1 format — just import exercises
        await importExercises(parsed);
        setJson('');
        Alert.alert('Success', 'Exercises imported (legacy format).');
        return;
      }

      Alert.alert(
        'Restore Backup',
        'This will REPLACE all current data with the backup. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              setRestoring(true);
              try {
                await db.withTransactionAsync(async () => {
                  // Delete in reverse dependency order
                  const deleteOrder = [...BACKUP_TABLES].reverse();
                  for (const table of deleteOrder) {
                    await executeSqlAsync(`DELETE FROM ${table};`);
                  }
                  // Insert in dependency order
                  for (const table of BACKUP_TABLES) {
                    const rows = parsed[table];
                    if (!Array.isArray(rows) || rows.length === 0) continue;
                    const cols = Object.keys(rows[0]);
                    const placeholders = cols.map(() => '?').join(',');
                    const sql = `INSERT INTO ${table}(${cols.join(',')}) VALUES (${placeholders});`;
                    for (const row of rows) {
                      await executeSqlAsync(sql, cols.map((c) => row[c] ?? null));
                    }
                  }
                });
                setJson('');
                Alert.alert('Success', 'Backup restored successfully. Restart the app for full effect.');
              } catch (e) {
                Alert.alert('Restore Error', 'Failed to restore: ' + (e as Error).message);
              } finally {
                setRestoring(false);
              }
            },
          },
        ]
      );
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
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
        <Text style={styles.buttonText}>Export Full Backup</Text>
      </Pressable>
      <Text style={styles.hint}>
        Exports all exercises, templates, sessions, sets, and settings as a single JSON file.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Restore Backup</Text>
      <Text style={styles.hint}>
        Paste a previously exported JSON backup below to restore all data.
      </Text>
      <TextInput
        value={json}
        onChangeText={setJson}
        placeholder='Paste backup JSON here...'
        multiline
        style={styles.textArea}
      />
      <Pressable
        onPress={restoreBackup}
        style={[styles.button, restoring && { opacity: 0.5 }]}
        disabled={restoring}
      >
        <Text style={styles.buttonText}>
          {restoring ? 'Restoring...' : 'Restore Backup'}
        </Text>
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
    </ScrollView>
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
  hint: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 8, paddingHorizontal: 2 },
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
