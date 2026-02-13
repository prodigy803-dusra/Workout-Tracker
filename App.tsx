/**
 * App entry point — initialises the database, shows a loading spinner,
 * then renders the root navigator wrapped in gesture + navigation providers.
 */
import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { initDb } from './src/db/db';
import { UnitProvider } from './src/contexts/UnitContext';
import { ThemeProvider, useColors } from './src/contexts/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import RootNavigator from './src/navigation';

SplashScreen.preventAutoHideAsync();

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
      })
      .finally(() => {
        SplashScreen.hideAsync();
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

  if (!ready) return null;

  return (
    <>
      <StatusBar barStyle={c.isDark ? 'light-content' : 'dark-content'} backgroundColor={c.background} translucent={false} />
      <ErrorBoundary>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
      </ErrorBoundary>
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
