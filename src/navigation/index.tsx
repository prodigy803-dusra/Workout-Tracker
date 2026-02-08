import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LogScreen from '../screens/LogScreen';
import HistoryScreen from '../screens/HistoryScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import TemplateEditorScreen from '../screens/TemplateEditorScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Log: '🏋️',
  History: '📋',
  Templates: '📑',
  Exercises: '💪',
  Settings: '⚙️',
};

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size }) => (
          <Text style={{ fontSize: size - 4 }}>{TAB_ICONS[route.name] || '•'}</Text>
        ),
      })}
    >
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="History" component={HistoryStack} options={{ headerShown: false }} />
      <Tab.Screen name="Templates" component={TemplatesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Exercises" component={ExercisesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
