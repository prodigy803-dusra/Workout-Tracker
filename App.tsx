/**
 * App entry point — initialises the database, shows a loading spinner,
 * then renders the root navigator wrapped in gesture + navigation providers.
 */
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { initDb } from './src/db/db';
import { UnitProvider } from './src/contexts/UnitContext';
import { ThemeProvider, useColors } from './src/contexts/ThemeContext';
import RootNavigator from './src/navigation';

function AppInner() {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const c = useColors();

  useEffect(() => {
    let mounted = true;
    initDb()
      .then(() => mounted && setReady(true))
      .catch((err) => {
        console.error('DB init failed', err);
        if (mounted) setInitError(String(err));
      });
    return () => {
      mounted = false;
    };
  }, []);

  const navTheme = c.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: c.background,
          card: c.tabBarBg,
          text: c.text,
          border: c.border,
          primary: c.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: c.background,
          card: c.tabBarBg,
          text: c.text,
          border: c.border,
          primary: c.accent,
        },
      };

  if (initError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: c.text }}>Database Error</Text>
        <Text style={{ fontSize: 14, color: c.textSecondary, textAlign: 'center' }}>{initError}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={c.isDark ? 'light-content' : 'dark-content'} backgroundColor={c.background} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UnitProvider>
          <AppInner />
        </UnitProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
