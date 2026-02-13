/**
 * IdleScreen — shown when no workout is in progress.
 *
 * Displays greeting, quick-start template cards, weekly stats, and onboarding.
 * Extracted from LogScreen per ARCHITECTURE.md §6.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { listTemplates } from '../db/repositories/templatesRepo';
import { overallStats } from '../db/repositories/statsRepo';
import { createDraftFromTemplate } from '../db/repositories/sessionsRepo';
import { useUnit } from '../contexts/UnitContext';
import { useColors } from '../contexts/ThemeContext';
import type { OverallStats, Template } from '../types';
import { idle } from '../screens/LogScreen.styles';

type Props = {
  onSessionStarted: () => void;
};

function IdleScreen({ onSessionStarted }: Props) {
  const navigation = useNavigation<any>();
  const { unit } = useUnit();
  const c = useColors();
  const [templates, setTemplates] = useState<Pick<Template, 'id' | 'name'>[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [greeting, setGreeting] = useState('');
  const [starting, setStarting] = useState(false);

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
    }, []),
  );

  const last7 = stats?.last7;
  const hasHistory = stats && stats.totalSessions > 0;

  async function quickStart(templateId: number) {
    if (starting) return;
    setStarting(true);
    try {
      await createDraftFromTemplate(templateId);
      onSessionStarted();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  }

  return (
    <ScrollView style={[idle.container, { backgroundColor: c.background }]} contentContainerStyle={idle.content}>
      {/* Greeting */}
      <View style={idle.hero}>
        <Text style={[idle.greeting, { color: c.textSecondary }]}>{greeting} 👋</Text>
        <Text style={[idle.heroTitle, { color: c.text }]}>Ready to train?</Text>
      </View>

      {/* Quick-start templates */}
      {templates.length > 0 && (
        <View style={idle.section}>
          <Text style={[idle.sectionTitle, { color: c.textSecondary }]}>QUICK START</Text>
          <View style={idle.templateGrid}>
            {templates.slice(0, 6).map((t) => (
              <Pressable
                key={t.id}
                style={[idle.templateCard, { backgroundColor: c.card, borderColor: c.border }, starting && { opacity: 0.5 }]}
                onPress={() => quickStart(t.id)}
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
    </ScrollView>
  );
}

export default React.memo(IdleScreen);
