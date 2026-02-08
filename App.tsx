import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { initDb } from './src/db/db';
import { UnitProvider } from './src/contexts/UnitContext';
import RootNavigator from './src/navigation';

export default function App() {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

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

  if (initError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Database Error</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>{initError}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UnitProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </UnitProvider>
    </GestureHandlerRootView>
  );
}
