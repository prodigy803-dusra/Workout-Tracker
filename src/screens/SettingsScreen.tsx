import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { Paths, File as ExpoFile } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { resetDb, executeSqlAsync, db } from '../db/db';
import { importExercises } from '../db/repositories/exercisesRepo';
import { logBodyWeight, bodyWeightTrend, latestBodyWeight, deleteBodyWeight } from '../db/repositories/bodyWeightRepo';
import {
  listAllInjuries,
  addInjury,
  updateInjury,
  resolveInjury,
  reactivateInjury,
  deleteInjury,
} from '../db/repositories/injuryRepo';
import type { Injury } from '../db/repositories/injuryRepo';
import { INJURY_REGIONS, SEVERITIES } from '../data/injuryRegionMap';
import type { Severity, InjuryType } from '../data/injuryRegionMap';
import { useUnit } from '../contexts/UnitContext';
import { useTheme, useColors, ThemeMode } from '../contexts/ThemeContext';
import TrendChart from '../components/TrendChart';
import InjuryModal from '../components/InjuryModal';
import { haptic } from '../utils/haptics';
import { shareWeeklySummary, currentWeekStart, weekEnd } from '../utils/weeklyPdf';
import {
  isRemindersEnabled,
  setRemindersEnabled,
  getInactivityDays,
  setInactivityDays,
  requestNotificationPermission,
  scheduleInactivityReminder,
  cancelAllReminders,
} from '../utils/notifications';
import { exportSessionsCsv } from '../utils/exportCsv';
import Constants from 'expo-constants';

/** Tables exported/restored in dependency order. */
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
  'active_injuries',
] as const;

/**
 * Columns to SKIP when exporting exercises — these are all seed/reference data
 * that gets re-populated from seed.ts on any fresh install.
 */
const EXERCISE_SKIP_COLS = new Set([
  'instructions', 'tips', 'video_url', 'aliases',
  'equipment', 'movement_pattern', 'secondary_muscle',
]);

function pad2(n: number) { return n < 10 ? '0' + n : '' + n; }

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

  // Injury tracker state
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [injuryModalVisible, setInjuryModalVisible] = useState(false);
  const [editingInjury, setEditingInjury] = useState<Injury | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  // Notification settings state
  const [remindersOn, setRemindersOn] = useState(false);
  const [inactDays, setInactDays] = useState('3');

  const loadBodyWeight = useCallback(async () => {
    const trend = await bodyWeightTrend();
    setBwTrend(trend);
    const latest = await latestBodyWeight();
    setBwLatest(latest);
  }, []);

  const loadInjuries = useCallback(async () => {
    const all = await listAllInjuries();
    setInjuries(all);
  }, []);

  const loadNotificationSettings = useCallback(async () => {
    const en = await isRemindersEnabled();
    setRemindersOn(en);
    const d = await getInactivityDays();
    setInactDays(String(d));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBodyWeight();
      loadInjuries();
      loadNotificationSettings();
    }, [loadBodyWeight, loadInjuries, loadNotificationSettings])
  );

  async function exportZip() {
    try {
      const zip = new JSZip();
      const meta = { exportedAt: new Date().toISOString(), version: 3, tables: [...BACKUP_TABLES] };
      zip.file('meta.json', JSON.stringify(meta));

      for (const table of BACKUP_TABLES) {
        const res = await executeSqlAsync(`SELECT * FROM ${table};`);
        let rows = res.rows._array;

        // Strip seed bloat from exercises — keep only ID-linkage + user-relevant cols
        if (table === 'exercises') {
          rows = rows.map((r: Record<string, unknown>) => {
            const slim: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(r)) {
              if (!EXERCISE_SKIP_COLS.has(k)) slim[k] = v;
            }
            return slim;
          });
        }

        zip.file(`${table}.json`, JSON.stringify(rows));
      }

      const base64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
      const zipFile = new ExpoFile(Paths.cache, 'workout_backup.zip');
      zipFile.write(base64, { encoding: 'base64' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipFile.uri, { mimeType: 'application/zip', dialogTitle: 'Export Workout Backup' });
      } else {
        Alert.alert('Sharing not available', 'Your device does not support file sharing.');
      }
    } catch (e) {
      Alert.alert('Export Error', 'Could not export data: ' + (e as Error).message);
    }
  }

  async function pickBackupFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const name = asset.name ?? 'backup file';

      if (name.endsWith('.zip')) {
        // Read zip as base64 and extract table JSONs
        const zipFile = new ExpoFile(asset.uri);
        const base64 = await zipFile.base64();
        const zip = await JSZip.loadAsync(base64, { base64: true });

        // Build a v3 payload object from individual table files
        const metaFile = zip.file('meta.json');
        const meta = metaFile ? JSON.parse(await metaFile.async('text')) : { version: 3 };
        const payload: Record<string, unknown> = { ...meta };

        for (const table of BACKUP_TABLES) {
          const f = zip.file(`${table}.json`);
          if (f) {
            payload[table] = JSON.parse(await f.async('text'));
          }
        }

        setJson(JSON.stringify(payload));
      } else {
        // Legacy JSON backup
        const file = new ExpoFile(asset.uri);
        const content = await file.text();
        setJson(content);
      }

      setPickedFileName(name);
      setShowPasteArea(false);
    } catch (e) {
      Alert.alert('Error', 'Could not read the selected file: ' + (e as Error).message);
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

      // Build a summary so the user knows what they're restoring
      const sessionCount = parsed.sessions?.length ?? 0;
      const templateCount = parsed.templates?.length ?? 0;
      const setCount = parsed.sets?.length ?? 0;
      const summaryLines = [
        `${sessionCount} workout sessions`,
        `${templateCount} templates`,
        `${setCount} sets`,
      ];
      if (parsed.personal_records?.length) summaryLines.push(`${parsed.personal_records.length} PRs`);
      if (parsed.body_weight?.length) summaryLines.push(`${parsed.body_weight.length} weigh-ins`);

      Alert.alert(
        'Restore Backup',
        `This will REPLACE all current data.\n\n${summaryLines.join('\n')}\n\nContinue?`,
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

                    // For exercises from v3 (slim) backups: the backup only has
                    // id/name/name_norm/created_at/primary_muscle. Insert those
                    // columns and let the seed data fill the rest on next launch.
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
                setPickedFileName(null);
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

  async function handleShareThisWeek() {
    try {
      const start = currentWeekStart();
      const end = weekEnd(start);
      await shareWeeklySummary(start, end, unit);
    } catch (e) {
      Alert.alert('PDF Error', 'Could not generate weekly summary: ' + (e as Error).message);
    }
  }

  async function handleShareLastWeek() {
    try {
      const thisStart = new Date(currentWeekStart() + 'T00:00:00');
      thisStart.setDate(thisStart.getDate() - 7);
      const start = `${thisStart.getFullYear()}-${pad2(thisStart.getMonth() + 1)}-${pad2(thisStart.getDate())}`;
      const end = weekEnd(start);
      await shareWeeklySummary(start, end, unit);
    } catch (e) {
      Alert.alert('PDF Error', 'Could not generate weekly summary: ' + (e as Error).message);
    }
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

      {/* ── Active Injuries ────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.text }]}>Active Injuries</Text>
      <Text style={[styles.hint, { color: c.textSecondary, marginBottom: 10 }]}>
        Log injuries to get adjusted workout suggestions and lighter weight prefills.
      </Text>

      {injuries.filter((inj) => !inj.resolved_at).length === 0 ? (
        <View style={[styles.bwCard, { backgroundColor: c.card, borderColor: c.border, paddingVertical: 20, alignItems: 'center' as const }]}>
          <Text style={{ fontSize: 28, marginBottom: 6 }}>✅</Text>
          <Text style={[{ color: c.textSecondary, fontSize: 14 }]}>No active injuries — keep it up!</Text>
        </View>
      ) : (
        injuries.filter((inj) => !inj.resolved_at).map((inj) => {
          const region = INJURY_REGIONS[inj.body_region];
          const sev = SEVERITIES.find((s) => s.value === inj.severity);
          return (
            <View key={inj.id} style={[styles.injuryCard, { backgroundColor: c.card, borderColor: sev?.color ?? c.border }]}>
              <View style={styles.injuryHeader}>
                <Text style={{ fontSize: 22 }}>{region?.icon ?? '🩹'}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.injuryName, { color: c.text }]}>
                    {region?.label ?? inj.body_region} — {sev?.label ?? inj.severity}
                  </Text>
                  <Text style={[styles.injuryMeta, { color: c.textSecondary }]}>
                    {inj.injury_type.replace('_', ' ')} • since {new Date(inj.started_at).toLocaleDateString()}
                  </Text>
                  {inj.notes ? (
                    <Text style={[styles.injuryNotes, { color: c.textTertiary }]} numberOfLines={2}>
                      {inj.notes}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ fontSize: 16 }}>{sev?.icon ?? '🟡'}</Text>
              </View>
              <View style={styles.injuryActions}>
                <Pressable
                  onPress={() => {
                    setEditingInjury(inj);
                    setInjuryModalVisible(true);
                  }}
                  style={[styles.injuryActionBtn, { borderColor: c.border }]}
                >
                  <Text style={[styles.injuryActionText, { color: c.accent }]}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Alert.alert('Mark as Healed', `Resolve ${region?.label ?? inj.body_region} injury?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Healed!',
                        onPress: async () => {
                          haptic('success');
                          await resolveInjury(inj.id);
                          await loadInjuries();
                        },
                      },
                    ]);
                  }}
                  style={[styles.injuryActionBtn, { borderColor: c.success, backgroundColor: c.success + '15' }]}
                >
                  <Text style={[styles.injuryActionText, { color: c.success }]}>✓ Healed</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      <Pressable
        onPress={() => {
          setEditingInjury(null);
          setInjuryModalVisible(true);
        }}
        style={[styles.button, { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, marginTop: 4 }]}
      >
        <Text style={[styles.buttonText, { color: c.text }]}>🩹 Log New Injury</Text>
      </Pressable>

      {/* Resolved injuries toggle */}
      {injuries.some((inj) => inj.resolved_at) && (
        <>
          <Pressable
            onPress={() => setShowResolved(!showResolved)}
            style={{ marginTop: 8, marginBottom: 4, paddingHorizontal: 2 }}
          >
            <Text style={{ color: c.primary, fontSize: 13, fontWeight: '600' }}>
              {showResolved ? '▲  Hide resolved injuries' : '▼  Show resolved injuries'}
            </Text>
          </Pressable>
          {showResolved &&
            injuries
              .filter((inj) => inj.resolved_at)
              .map((inj) => {
                const region = INJURY_REGIONS[inj.body_region];
                return (
                  <View key={inj.id} style={[styles.injuryCard, { backgroundColor: c.card, borderColor: c.border, opacity: 0.7 }]}>
                    <View style={styles.injuryHeader}>
                      <Text style={{ fontSize: 18 }}>{region?.icon ?? '🩹'}</Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.injuryName, { color: c.textSecondary }]}>
                          {region?.label ?? inj.body_region} — {inj.severity}
                        </Text>
                        <Text style={[styles.injuryMeta, { color: c.textTertiary }]}>
                          Resolved {new Date(inj.resolved_at!).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.injuryActions}>
                      <Pressable
                        onPress={async () => {
                          haptic('light');
                          await reactivateInjury(inj.id);
                          await loadInjuries();
                        }}
                        style={[styles.injuryActionBtn, { borderColor: c.border }]}
                      >
                        <Text style={[styles.injuryActionText, { color: c.accent }]}>Reactivate</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Alert.alert('Delete Record', 'Permanently remove this injury record?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                await deleteInjury(inj.id);
                                await loadInjuries();
                              },
                            },
                          ]);
                        }}
                        style={[styles.injuryActionBtn, { borderColor: c.danger }]}
                      >
                        <Text style={[styles.injuryActionText, { color: c.danger }]}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
        </>
      )}

      {/* Injury Modal */}
      <InjuryModal
        visible={injuryModalVisible}
        onClose={() => {
          setInjuryModalVisible(false);
          setEditingInjury(null);
        }}
        existing={editingInjury}
        onSave={async (data) => {
          if (editingInjury) {
            await updateInjury(editingInjury.id, data.bodyRegion, data.injuryType, data.severity, data.notes);
          } else {
            await addInjury(data.bodyRegion, data.injuryType, data.severity, data.notes);
          }
          await loadInjuries();
        }}
      />

      <Text style={[styles.sectionTitle, { color: c.text }]}>Workout Reminders</Text>
      <Text style={[styles.hint, { color: c.textSecondary, marginBottom: 8 }]}>
        Get a push notification if you haven't trained in a while.
      </Text>
      <View style={[styles.bwCard, { backgroundColor: c.card, borderColor: c.border, paddingVertical: 14 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>Enable Reminders</Text>
            <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
              {remindersOn ? 'Active' : 'Off'}
            </Text>
          </View>
          <Switch
            value={remindersOn}
            onValueChange={async (val) => {
              if (val) {
                const granted = await requestNotificationPermission();
                if (!granted) {
                  Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
                  return;
                }
              }
              setRemindersOn(val);
              await setRemindersEnabled(val);
              if (val) {
                await scheduleInactivityReminder();
              } else {
                await cancelAllReminders();
              }
            }}
            trackColor={{ true: c.primary }}
          />
        </View>
        {remindersOn && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
            <Text style={{ fontSize: 14, color: c.text }}>Remind after</Text>
            <TextInput
              value={inactDays}
              onChangeText={setInactDays}
              onEndEditing={async () => {
                const d = parseInt(inactDays, 10);
                if (!d || d < 1) {
                  setInactDays('3');
                  await setInactivityDays(3);
                } else {
                  await setInactivityDays(d);
                }
                await scheduleInactivityReminder();
              }}
              keyboardType="number-pad"
              style={{
                width: 48,
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '700',
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 8,
                paddingVertical: 6,
                paddingHorizontal: 8,
                backgroundColor: c.inputBg,
                color: c.text,
              }}
            />
            <Text style={{ fontSize: 14, color: c.text }}>days of inactivity</Text>
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Weekly Summary</Text>
      <Text style={[styles.hint, { color: c.textSecondary }]}>
        Generate a PDF report of this week's workouts — share it with your trainer or keep it for your records.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        <Pressable
          onPress={handleShareThisWeek}
          style={[styles.button, { flex: 1, backgroundColor: c.primary }]}
        >
          <Text style={[styles.buttonText, { color: c.primaryText }]}>📄  This Week</Text>
        </Pressable>
        <Pressable
          onPress={handleShareLastWeek}
          style={[styles.button, { flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }]}
        >
          <Text style={[styles.buttonText, { color: c.text }]}>📄  Last Week</Text>
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Data</Text>

      <Pressable onPress={exportZip} style={[styles.button, { backgroundColor: c.primary }]}>
        <Text style={[styles.buttonText, { color: c.primaryText }]}>Export Backup (.zip)</Text>
      </Pressable>
      <Text style={[styles.hint, { color: c.textSecondary }]}>
        Exports your templates, sessions, sets, PRs, and settings as a zip file.  Exercise library data (guides, tips) is skipped — it reloads automatically.
      </Text>

      <Pressable
        onPress={async () => {
          try { await exportSessionsCsv(); }
          catch (e: any) { Alert.alert('Export failed', e.message ?? String(e)); }
        }}
        style={[styles.button, { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, marginTop: 10 }]}
      >
        <Text style={[styles.buttonText, { color: c.text }]}>📊  Export CSV</Text>
      </Pressable>
      <Text style={[styles.hint, { color: c.textSecondary }]}>
        Exports all finished workouts as a spreadsheet-friendly CSV file.
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 24, color: c.text }]}>Restore Backup</Text>
      <Text style={[styles.hint, { color: c.textSecondary }]}>
        Select a .zip or legacy .json backup file, or paste JSON contents manually.
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

  // Injury tracker
  injuryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  injuryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  injuryName: {
    fontSize: 15,
    fontWeight: '700',
  },
  injuryMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  injuryNotes: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  injuryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  injuryActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  injuryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
