import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { resetDb, executeSqlAsync, db } from '../db/db';
import { importExercises } from '../db/repositories/exercisesRepo';
import { logBodyWeight, bodyWeightTrend, latestBodyWeight, deleteBodyWeight } from '../db/repositories/bodyWeightRepo';
import { useUnit } from '../contexts/UnitContext';
import { useTheme, useColors, ThemeMode } from '../contexts/ThemeContext';
import TrendChart from '../components/TrendChart';
import { haptic } from '../utils/haptics';
import Constants from 'expo-constants';

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
  'drop_set_segments',
  'personal_records',
  'body_weight',
  'app_settings',
] as const;

export default function SettingsScreen() {
  const [json, setJson] = useState('');
  const [resetting, setResetting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const { unit, setUnit } = useUnit();
  const { mode, setMode } = useTheme();
  const c = useColors();

  // Body weight tracker state
  const [bwInput, setBwInput] = useState('');
  const [bwTrend, setBwTrend] = useState<Array<{ date: string; value: number }>>([]);
  const [bwLatest, setBwLatest] = useState<{ id: number; weight: number; measured_at: string } | null>(null);

  const loadBodyWeight = useCallback(async () => {
    const trend = await bodyWeightTrend();
    setBwTrend(trend);
    const latest = await latestBodyWeight();
    setBwLatest(latest);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBodyWeight();
    }, [loadBodyWeight])
  );

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

  async function pickBackupFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const file = new File(asset.uri);
      const content = file.text();
      setJson(content);
      setPickedFileName(asset.name ?? 'backup file');
      setShowPasteArea(false);
    } catch (e) {
      Alert.alert('Error', 'Could not read the selected file.');
    }
  }

  async function restoreBackup() {
    if (!json.trim()) {
      Alert.alert('No Data', 'Pick a backup file or paste JSON first.');
      return;
    }
    try {
      const parsed = JSON.parse(json);
      if (!parsed.version || parsed.version < 2) {
        // Legacy v1 format — just import exercises
        await importExercises(parsed);
        setJson('');
        Alert.alert('Success', 'Exercises imported (legacy format).');
        return;
      }

      // Validate that backup contains expected tables with correct columns
      const REQUIRED_TABLES = ['exercises', 'sessions', 'sets'];
      for (const table of REQUIRED_TABLES) {
        if (!Array.isArray(parsed[table])) {
          Alert.alert('Invalid Backup', `Missing or invalid table: ${table}. Backup may be corrupted.`);
          return;
        }
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
                    // Safety: only allow known column names (alphanumeric + underscore)
                    if (cols.some(col => !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col))) {
                      throw new Error(`Invalid column name in table ${table}`);
                    }
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}>
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <Text style={[styles.sectionTitle, { color: c.text }]}>Theme</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[
              styles.button,
              m === mode
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
              { flex: 1 },
            ]}
          >
            <Text style={[styles.buttonText, m === mode ? { color: c.primaryText } : { color: c.text }]}>
              {m === 'light' ? '☀️ Light' : m === 'dark' ? '🌙 Dark' : '📱 System'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Unit</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {(['kg', 'lb'] as const).map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            style={[
              styles.button,
              u === unit
                ? { backgroundColor: c.primary }
                : { backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
              { flex: 1 },
            ]}
          >
            <Text style={[styles.buttonText, u === unit ? { color: c.primaryText } : { color: c.text }]}>
              {u.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Body Weight</Text>
      <View style={[styles.bwCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {bwLatest && (
          <Pressable
            onLongPress={() => {
              Alert.alert('Delete Entry', `Remove ${bwLatest.weight} ${unit} entry?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteBodyWeight(bwLatest.id);
                    haptic('light');
                    await loadBodyWeight();
                  },
                },
              ]);
            }}
          >
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.bwCurrent, { color: c.text }]}>
                {bwLatest.weight} {unit}
              </Text>
              <Text style={[styles.bwDate, { color: c.textSecondary }]}>
                Last logged: {new Date(bwLatest.measured_at).toLocaleDateString()}  •  Hold to delete
              </Text>
            </View>
          </Pressable>
        )}
        <View style={styles.bwInputRow}>
          <TextInput
            value={bwInput}
            onChangeText={setBwInput}
            placeholder={`Weight (${unit})`}
            placeholderTextColor={c.textTertiary}
            keyboardType="decimal-pad"
            style={[styles.bwInput, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
          />
          <Pressable
            onPress={async () => {
              const w = parseFloat(bwInput);
              if (!w || w <= 0) {
                Alert.alert('Invalid', 'Enter a valid weight');
                return;
              }
              haptic('light');
              await logBodyWeight(w, unit);
              setBwInput('');
              await loadBodyWeight();
            }}
            style={[styles.bwLogBtn, { backgroundColor: c.primary }]}
          >
            <Text style={[styles.bwLogBtnText, { color: c.primaryText }]}>Log</Text>
          </Pressable>
        </View>
        {bwTrend.length >= 2 && (
          <View style={{ marginTop: 12 }}>
            <TrendChart data={bwTrend} label="Body Weight" unit={unit} />
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Data</Text>

      <Pressable onPress={exportJson} style={[styles.button, { backgroundColor: c.primary }]}>
        <Text style={[styles.buttonText, { color: c.primaryText }]}>Export Full Backup</Text>
      </Pressable>
      <Text style={[styles.hint, { color: c.textSecondary }]}>
        Exports all exercises, templates, sessions, sets, and settings as a single JSON file.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 24, color: c.text }]}>Restore Backup</Text>
      <Text style={[styles.hint, { color: c.textSecondary }]}>
        Select a previously exported JSON backup file, or paste its contents manually.
      </Text>

      <Pressable onPress={pickBackupFile} style={[styles.button, { backgroundColor: c.card, borderWidth: 1, borderColor: c.border }]}>
        <Text style={[styles.buttonText, { color: c.text }]}>📂  Pick Backup File</Text>
      </Pressable>

      {pickedFileName && (
        <View style={[styles.pickedFileRow, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.pickedFileName, { color: c.text }]} numberOfLines={1}>✅  {pickedFileName}</Text>
          <Pressable onPress={() => { setJson(''); setPickedFileName(null); }}>
            <Text style={{ color: c.danger, fontWeight: '600', fontSize: 14 }}>Remove</Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => setShowPasteArea(!showPasteArea)} style={{ marginTop: 4, marginBottom: 8, paddingHorizontal: 2 }}>
        <Text style={{ color: c.primary, fontSize: 13, fontWeight: '600' }}>
          {showPasteArea ? '▲  Hide paste area' : '▼  Or paste JSON manually'}
        </Text>
      </Pressable>

      {showPasteArea && (
        <TextInput
          value={json}
          onChangeText={(t) => { setJson(t); setPickedFileName(null); }}
          placeholder='Paste backup JSON here...'
          placeholderTextColor={c.textTertiary}
          multiline
          style={[styles.textArea, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
        />
      )}

      <Pressable
        onPress={restoreBackup}
        style={[styles.button, { backgroundColor: c.primary }, (restoring || !json.trim()) && { opacity: 0.5 }]}
        disabled={restoring || !json.trim()}
      >
        <Text style={[styles.buttonText, { color: c.primaryText }]}>
          {restoring ? 'Restoring...' : 'Restore Backup'}
        </Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: 24, color: c.text }]}>Danger Zone</Text>
      <Pressable
        onPress={handleReset}
        style={[styles.button, { backgroundColor: c.dangerBg, borderWidth: 1, borderColor: c.danger }]}
        disabled={resetting}
      >
        <Text style={[styles.buttonText, { color: c.danger }]}>
          {resetting ? 'Resetting...' : 'Reset Database'}
        </Text>
      </Pressable>

      <Text style={[styles.versionText, { color: c.textTertiary }]}>
        v{Constants.expoConfig?.version ?? '?'}
      </Text>
    </ScrollView>
    </KeyboardAvoidingView>
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
  pickedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  pickedFileName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },

  // Body weight tracker
  bwCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  bwCurrent: {
    fontSize: 28,
    fontWeight: '800',
  },
  bwDate: {
    fontSize: 12,
    marginTop: 2,
  },
  bwInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bwInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  bwLogBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bwLogBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 24,
  },
});
