/**
 * ThemeContext — provides light/dark theme colors across the app.
 * Persists the user's preference in the app_settings table.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { executeSqlAsync } from '../db/db';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  inputBg: string;
  accent: string;
  accentBg: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  warningText: string;
  headerBg: string;
  tabBarBg: string;
  isDark: boolean;
  primary: string;
  primaryText: string;
  sectionHeaderBg: string;
  completedBg: string;
  completedBorder: string;
};

const LIGHT: ThemeColors = {
  background: '#F6F4F1',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#888888',
  textTertiary: '#AAAAAA',
  border: '#E6E1DB',
  inputBg: '#F8F8F8',
  accent: '#4A90D9',
  accentBg: '#F0F7FF',
  danger: '#DC2626',
  dangerBg: '#FFF0F0',
  success: '#1A7F37',
  successBg: '#F0FFF4',
  warning: '#F5D76E',
  warningBg: '#FFFBE6',
  warningText: '#7A6B00',
  headerBg: '#FAFAFA',
  tabBarBg: '#FFFFFF',
  isDark: false,
  primary: '#111111',
  primaryText: '#FFFFFF',
  sectionHeaderBg: '#F0EBE5',
  completedBg: '#F0FFF4',
  completedBorder: '#D0E8D6',
};

const DARK: ThemeColors = {
  background: '#0D0D0D',
  card: '#1A1A1A',
  text: '#E8E8E8',
  textSecondary: '#999999',
  textTertiary: '#666666',
  border: '#2C2C2C',
  inputBg: '#242424',
  accent: '#5BA3EC',
  accentBg: '#1A2A3A',
  danger: '#FF453A',
  dangerBg: '#3A1A1A',
  success: '#2EA043',
  successBg: '#1A2E1F',
  warning: '#F5D76E',
  warningBg: '#3A3420',
  warningText: '#F5D76E',
  headerBg: '#151515',
  tabBarBg: '#121212',
  isDark: true,
  primary: '#E8E8E8',
  primaryText: '#0D0D0D',
  sectionHeaderBg: '#1A1A1A',
  completedBg: '#1A2E1F',
  completedBorder: '#2A4A35',
};

type ThemeContextType = {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (m: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: DARK,
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    (async () => {
      try {
        const res = await executeSqlAsync(
          `SELECT value FROM app_settings WHERE key='theme';`
        );
        if (res.rows.length) {
          setModeState(res.rows.item(0).value as ThemeMode);
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      }
    })();
  }, []);

  const resolvedDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const colors = resolvedDark ? DARK : LIGHT;

  const setMode = useCallback(async (m: ThemeMode) => {
    setModeState(m);
    try {
      await executeSqlAsync(
        `INSERT INTO app_settings(key, value) VALUES ('theme', ?)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value;`,
        [m]
      );
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}
