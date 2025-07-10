import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { colors } from './colors';

type Theme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  colors: typeof colors.light;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const storage = new MMKV();
const THEME_STORAGE_KEY = 'ivaults_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<Theme>(systemColorScheme || 'light');

  // Load saved theme mode on mount
  useEffect(() => {
    const savedMode = storage.getString(THEME_STORAGE_KEY);
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setThemeMode(savedMode as ThemeMode);
    }
  }, []);

  // Update theme based on mode and system scheme
  useEffect(() => {
    if (themeMode === 'system') {
      setTheme(systemColorScheme || 'light');
    } else {
      setTheme(themeMode as Theme);
    }
  }, [themeMode, systemColorScheme]);

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    storage.set(THEME_STORAGE_KEY, mode);
  };

  const value = {
    theme,
    themeMode,
    colors: colors[theme],
    setThemeMode: handleSetThemeMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};