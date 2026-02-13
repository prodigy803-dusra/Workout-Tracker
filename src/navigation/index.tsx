/**
 * Root navigation — bottom tab navigator with five tabs.
 *
 * Tabs:
 *   Log        — stack: active workout / idle dashboard → workout summary
 *   History    — stack: list → session detail
 *   Templates  — stack: list → template editor
 *   Exercises  — stack: list → exercise detail
 *   Settings   — unit toggle, theme toggle, backup/restore, reset
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import LogScreen from '../screens/LogScreen';
import WorkoutSummaryScreen from '../screens/WorkoutSummaryScreen';
import HistoryScreen from '../screens/HistoryScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import TemplateEditorScreen from '../screens/TemplateEditorScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useColors } from '../contexts/ThemeContext';
import type {
  RootTabParamList,
  LogStackParamList,
  HistoryStackParamList,
  TemplatesStackParamList,
  ExercisesStackParamList,
} from '../types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const LogStackNav = createNativeStackNavigator<LogStackParamList>();
const HistoryStackNav = createNativeStackNavigator<HistoryStackParamList>();
const TemplatesStackNav = createNativeStackNavigator<TemplatesStackParamList>();
const ExercisesStackNav = createNativeStackNavigator<ExercisesStackParamList>();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Log: 'barbell-outline',
  History: 'time-outline',
  Templates: 'document-text-outline',
  Exercises: 'fitness-outline',
  Settings: 'settings-outline',
};

function LogStack() {
  return (
    <LogStackNav.Navigator>
      <LogStackNav.Screen name="LogHome" component={LogScreen} options={{ title: 'Log' }} />
      <LogStackNav.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ title: 'Summary', headerBackTitle: 'Back' }}
      />
    </LogStackNav.Navigator>
  );
}

function TemplatesStack() {
  return (
    <TemplatesStackNav.Navigator>
      <TemplatesStackNav.Screen name="TemplatesHome" component={TemplatesScreen} options={{ title: 'Templates' }} />
      <TemplatesStackNav.Screen name="TemplateEditor" component={TemplateEditorScreen} options={{ title: 'Edit Template' }} />
    </TemplatesStackNav.Navigator>
  );
}

function HistoryStack() {
  return (
    <HistoryStackNav.Navigator>
      <HistoryStackNav.Screen name="HistoryHome" component={HistoryScreen} options={{ title: 'History' }} />
      <HistoryStackNav.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: 'Session' }} />
    </HistoryStackNav.Navigator>
  );
}

function ExercisesStack() {
  return (
    <ExercisesStackNav.Navigator>
      <ExercisesStackNav.Screen name="ExercisesHome" component={ExercisesScreen} options={{ title: 'Exercises' }} />
      <ExercisesStackNav.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise' }} />
    </ExercisesStackNav.Navigator>
  );
}

export default function RootNavigator() {
  const c = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size, color }) => (
          <Ionicons name={TAB_ICONS[route.name] || 'ellipse-outline'} size={size} color={color} />
        ),
        tabBarStyle: {
          backgroundColor: c.tabBarBg,
          borderTopColor: c.border,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textTertiary,
        headerStyle: { backgroundColor: c.headerBg },
        headerTintColor: c.text,
      })}
    >
      <Tab.Screen name="Log" component={LogStack} options={{ headerShown: false }} />
      <Tab.Screen name="History" component={HistoryStack} options={{ headerShown: false }} />
      <Tab.Screen name="Templates" component={TemplatesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Exercises" component={ExercisesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
