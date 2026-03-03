/**
 * IdleScreen — shown when no workout is in progress.
 *
 * Displays greeting, quick-start template cards, weekly stats, and onboarding.
 * Extracted from LogScreen per ARCHITECTURE.md §6.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { listTemplates } from '../db/repositories/templatesRepo';
import { overallStats, weeklyVolumeByMuscle } from '../db/repositories/statsRepo';
import { createDraftFromTemplate } from '../db/repositories/sessionsRepo';
import { listActiveInjuries, addInjury } from '../db/repositories/injuryRepo';
import type { Injury } from '../db/repositories/injuryRepo';
import { INJURY_REGIONS, SEVERITIES, SEVERITY_WEIGHT_FACTOR } from '../data/injuryRegionMap';
import type { Severity, InjuryType } from '../data/injuryRegionMap';
import InjuryModal from './InjuryModal';
import { useUnit } from '../contexts/UnitContext';
import { useColors } from '../contexts/ThemeContext';
import WeeklyVolumeCard from './WeeklyVolumeCard';
import type { OverallStats, Template, MuscleVolumeRow } from '../types';
import { idle } from '../screens/LogScreen.styles';

type Props = {
  onSessionStarted: () => void;
};

const READINESS_OPTIONS = [
  { key: 'great' as const, emoji: '💪', label: 'Feeling Great' },
  { key: 'good' as const, emoji: '👍', label: 'Good to Go' },
  { key: 'sore' as const, emoji: '🤕', label: 'A Bit Sore' },
];

function IdleScreen({ onSessionStarted }: Props) {
  const navigation = useNavigation<any>();
  const { unit } = useUnit();
  const c = useColors();
  const [templates, setTemplates] = useState<Pick<Template, 'id' | 'name'>[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeRow[]>([]);
  const [greeting, setGreeting] = useState('');
  const [starting, setStarting] = useState(false);
  const [activeInjuries, setActiveInjuries] = useState<Injury[]>([]);
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<number | null>(null);
  const [readiness, setReadiness] = useState<'great' | 'good' | 'sore' | null>(null);
  const [injuryModalVisible, setInjuryModalVisible] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useFocusEffect(
    useCallback(() => {
      listTemplates().then(setTemplates);
      overallStats().then(setStats);
      weeklyVolumeByMuscle().then(setMuscleVolume);
      listActiveInjuries().then(setActiveInjuries);
    }, []),
  );

  const last7 = stats?.last7;
  const hasHistory = stats && stats.totalSessions > 0;

  /** Pre-workout check-in — always shown before starting a workout */
  function handleStartPress(templateId: number) {
    if (starting) return;
    setPendingTemplateId(templateId);
    setReadiness(null);
    setCheckInVisible(true);
  }

  /** Confirmed — actually create the draft and start */
  async function doQuickStart(templateId: number) {
    if (starting) return;
    setStarting(true);
    setCheckInVisible(false);
    setPendingTemplateId(null);
    try {
      await createDraftFromTemplate(templateId);
      onSessionStarted();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  }

  function dismissCheckIn() {
    setCheckInVisible(false);
    setPendingTemplateId(null);
    setReadiness(null);
  }

  /** Save a new injury logged from the pre-workout check-in */
  async function handleCheckInInjurySave(data: {
    bodyRegion: string;
    injuryType: InjuryType;
    severity: Severity;
    notes: string | null;
  }) {
    await addInjury(data.bodyRegion, data.injuryType, data.severity, data.notes ?? undefined);
    const updated = await listActiveInjuries();
    setActiveInjuries(updated);
  }

  return (
    <ScrollView style={[idle.container, { backgroundColor: c.background }]} contentContainerStyle={idle.content}>
      {/* Greeting */}
      <View style={idle.hero}>
        <Text style={[idle.greeting, { color: c.textSecondary }]}>{greeting} 👋</Text>
        <Text style={[idle.heroTitle, { color: c.text }]}>Ready to train?</Text>
      </View>

      {/* Active injury notice */}
      {activeInjuries.length > 0 && (
        <View style={{
          marginHorizontal: 0,
          marginBottom: 16,
          padding: 14,
          borderRadius: 12,
          backgroundColor: c.isDark ? '#2A2200' : '#FFF8E1',
          borderWidth: 1,
          borderColor: c.isDark ? '#5C4A00' : '#FFE082',
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: c.isDark ? '#FFD54F' : '#F57F17', marginBottom: 6 }}>
            🩹 Active Injuries
          </Text>
          {activeInjuries.map((inj) => {
            const region = INJURY_REGIONS[inj.body_region];
            const sev = SEVERITIES.find((s) => s.value === inj.severity);
            return (
              <Text key={inj.id} style={{ fontSize: 13, color: c.text, marginBottom: 2 }}>
                {region?.icon ?? '⚠️'} {region?.label ?? inj.body_region} — {sev?.label ?? inj.severity}
                {inj.severity !== 'severe' ? ' (weights reduced)' : ' (avoid exercise)'}
              </Text>
            );
          })}
          <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 6 }}>
            Manage in Settings → Active Injuries
          </Text>
        </View>
      )}

      {/* Quick-start templates */}
      {templates.length > 0 && (
        <View style={idle.section}>
          <Text style={[idle.sectionTitle, { color: c.textSecondary }]}>QUICK START</Text>
          <View style={idle.templateGrid}>
            {templates.slice(0, 6).map((t) => (
              <Pressable
                key={t.id}
                style={[idle.templateCard, { backgroundColor: c.card, borderColor: c.border }, starting && { opacity: 0.5 }]}
                onPress={() => handleStartPress(t.id)}
                disabled={starting}
              >
                <Text style={idle.templateIcon}>🏋️</Text>
                <Text style={[idle.templateName, { color: c.text }]} numberOfLines={2}>
                  {t.name}
                </Text>
                <Text style={[idle.templateAction, { color: c.accent }]}>{starting ? 'Starting…' : 'Start →'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Weekly stats summary */}
      {hasHistory && last7 && (
        <View style={idle.section}>
          <Text style={[idle.sectionTitle, { color: c.textSecondary }]}>THIS WEEK</Text>
          <View style={idle.statsRow}>
            <View style={[idle.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[idle.statNumber, { color: c.text }]}>{last7.sessionsCount}</Text>
              <Text style={[idle.statLabel, { color: c.textSecondary }]}>Workouts</Text>
            </View>
            <View style={[idle.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[idle.statNumber, { color: c.text }]}>{last7.setsCount}</Text>
              <Text style={[idle.statLabel, { color: c.textSecondary }]}>Sets</Text>
            </View>
            <View style={[idle.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[idle.statNumber, { color: c.text }]}>
                {last7.totalVolume >= 1000
                  ? `${(last7.totalVolume / 1000).toFixed(1)}k`
                  : last7.totalVolume}
              </Text>
              <Text style={[idle.statLabel, { color: c.textSecondary }]}>Vol ({unit})</Text>
            </View>
          </View>
        </View>
      )}

      {/* Weekly muscle volume dashboard */}
      {muscleVolume.length > 0 && (
        <View style={idle.section}>
          <WeeklyVolumeCard data={muscleVolume} />
        </View>
      )}

      {/* All-time stats */}
      {hasHistory && (
        <View style={idle.section}>
          <View style={[idle.allTimeCard, { backgroundColor: c.isDark ? '#222' : '#1A1A1A' }]}>
            <Text style={[idle.allTimeNum, { color: '#FFF' }]}>{stats.totalSessions}</Text>
            <Text style={[idle.allTimeLabel, { color: c.isDark ? '#CCC' : '#AAA' }]}>total workouts logged</Text>
          </View>
        </View>
      )}

      {/* Empty state for new users */}
      {templates.length === 0 && (
        <View style={idle.onboarding}>
          <Text style={idle.onboardingIcon}>📑</Text>
          <Text style={[idle.onboardingTitle, { color: c.text }]}>Create your first template</Text>
          <Text style={[idle.onboardingBody, { color: c.textSecondary }]}>
            Set up a workout template in the Templates tab, then come back here to start logging.
          </Text>
          <Pressable
            style={[idle.onboardingBtn, { backgroundColor: c.primary }]}
            onPress={() => navigation.navigate('Templates')}
          >
            <Text style={[idle.onboardingBtnText, { color: c.primaryText }]}>Go to Templates</Text>
          </Pressable>
        </View>
      )}
      {/* Universal pre-workout check-in modal */}
      <Modal
        visible={checkInVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissCheckIn}
      >
        <Pressable style={checkInStyles.overlay} onPress={dismissCheckIn}>
          <Pressable style={[checkInStyles.card, { backgroundColor: c.card, borderColor: c.border, maxHeight: '85%' }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Header */}
              <Text style={[checkInStyles.title, { color: c.text }]}>🏋️ Pre-Workout Check-In</Text>
              <Text style={[checkInStyles.subtitle, { color: c.textSecondary }]}>
                How are you feeling today?
              </Text>

              {/* Readiness selector */}
              <View style={checkInStyles.readinessRow}>
                {READINESS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[
                      checkInStyles.readinessChip,
                      {
                        borderColor: readiness === opt.key ? c.primary : c.border,
                        backgroundColor: readiness === opt.key
                          ? (c.isDark ? 'rgba(76,175,80,0.15)' : 'rgba(76,175,80,0.08)')
                          : 'transparent',
                      },
                    ]}
                    onPress={() => setReadiness(opt.key)}
                  >
                    <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                    <Text
                      style={[
                        checkInStyles.readinessLabel,
                        { color: readiness === opt.key ? c.primary : c.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Active injuries section (shown when injuries exist) */}
              {activeInjuries.length > 0 && (
                <View style={checkInStyles.injurySection}>
                  <Text style={[checkInStyles.sectionLabel, { color: c.textSecondary }]}>
                    🩹 Active Injuries
                  </Text>
                  <View style={checkInStyles.injuryList}>
                    {activeInjuries.map((inj) => {
                      const region = INJURY_REGIONS[inj.body_region];
                      const sev = SEVERITIES.find((s) => s.value === inj.severity);
                      const factor = SEVERITY_WEIGHT_FACTOR[inj.severity as Severity];
                      const pct = factor === 0 ? null : Math.round(factor * 100);
                      return (
                        <View key={inj.id} style={[checkInStyles.injuryRow, { borderColor: sev?.color ?? c.border }]}>
                          <Text style={{ fontSize: 24 }}>{region?.icon ?? '⚠️'}</Text>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[checkInStyles.injuryName, { color: c.text }]}>
                              {region?.label ?? inj.body_region}
                            </Text>
                            <Text style={[checkInStyles.injurySev, { color: sev?.color ?? c.textSecondary }]}>
                              {sev?.icon} {sev?.label ?? inj.severity}
                              {pct != null ? ` — weights at ${pct}%` : ' — exercises skipped'}
                            </Text>
                            {inj.notes ? (
                              <Text style={[checkInStyles.injuryNotes, { color: c.textSecondary }]} numberOfLines={1}>
                                {inj.notes}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  <Text style={[checkInStyles.tip, { color: c.textSecondary }]}>
                    Affected exercises will show warning banners and weights are automatically reduced.
                  </Text>
                </View>
              )}

              {/* Log an injury option — always available */}
              <Pressable
                style={[checkInStyles.logInjuryBtn, { borderColor: c.border }]}
                onPress={() => setInjuryModalVisible(true)}
              >
                <Text style={[checkInStyles.logInjuryBtnText, { color: c.accent }]}>
                  🩹 Anything bothering you? Log an injury
                </Text>
              </Pressable>

              {/* Actions */}
              <View style={checkInStyles.actions}>
                <Pressable
                  style={[checkInStyles.primaryBtn, { backgroundColor: c.primary }]}
                  onPress={() => pendingTemplateId != null && doQuickStart(pendingTemplateId)}
                >
                  <Text style={[checkInStyles.primaryBtnText, { color: c.primaryText }]}>
                    Start Workout
                  </Text>
                </Pressable>
                <Pressable onPress={dismissCheckIn}>
                  <Text style={[checkInStyles.cancelText, { color: c.textSecondary }]}>Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Inline injury modal from check-in */}
      <InjuryModal
        visible={injuryModalVisible}
        onClose={() => setInjuryModalVisible(false)}
        onSave={handleCheckInInjurySave}
      />
    </ScrollView>
  );
}

const checkInStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  card: {
    width: '100%' as const,
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  injuryList: {
    gap: 10,
    marginBottom: 16,
  },
  injuryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(128,128,128,0.06)',
  },
  injuryName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  injurySev: {
    fontSize: 13,
    marginTop: 2,
  },
  injuryNotes: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  tip: {
    fontSize: 12,
    textAlign: 'center' as const,
    marginBottom: 18,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    alignItems: 'center' as const,
  },
  primaryBtn: {
    width: '100%' as const,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryBtn: {
    width: '100%' as const,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  cancelText: {
    fontSize: 14,
    marginTop: 4,
  },
  readinessRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    marginBottom: 18,
  },
  readinessChip: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  readinessLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  injurySection: {
    marginBottom: 14,
  },
  logInjuryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    marginBottom: 18,
  },
  logInjuryBtnText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
};

export default React.memo(IdleScreen);
