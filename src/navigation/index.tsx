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
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Log: '🏋️',
  History: '📋',
  Templates: '📑',
  Exercises: '💪',
  Settings: '⚙️',
};

function LogStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LogHome" component={LogScreen} options={{ title: 'Log' }} />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ title: 'Summary', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}

function TemplatesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TemplatesHome" component={TemplatesScreen} options={{ title: 'Templates' }} />
      <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} options={{ title: 'Edit Template' }} />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HistoryHome" component={HistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: 'Session' }} />
    </Stack.Navigator>
  );
}

function ExercisesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ExercisesHome" component={ExercisesScreen} options={{ title: 'Exercises' }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const c = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size }) => (
          <Text style={{ fontSize: size - 4 }}>{TAB_ICONS[route.name] || '•'}</Text>
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
