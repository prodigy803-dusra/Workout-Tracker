import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { initDb } from './src/db/db';
import { UnitProvider } from './src/contexts/UnitContext';
import RootNavigator from './src/navigation';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    initDb()
      .then(() => mounted && setReady(true))
      .catch((err) => {
        console.error('DB init failed', err);
        mounted && setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
