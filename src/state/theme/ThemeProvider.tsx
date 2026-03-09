import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'nativewind';

import { darkTokens, lightTokens, type ThemeName, type ThemeTokens } from './tokens';

export type ThemeMode = ThemeName | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  themeName: ThemeName;
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialMode = 'system' }) => {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const { colorScheme, setColorScheme } = useColorScheme();

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      setColorScheme(nextMode);
    },
    [setColorScheme],
  );

  const themeName: ThemeName = useMemo(() => {
    const resolved = mode === 'system' ? (colorScheme ?? 'light') : mode;
    return resolved === 'dark' ? 'dark' : 'light';
  }, [colorScheme, mode]);

  const tokens = useMemo(() => (themeName === 'dark' ? darkTokens : lightTokens), [themeName]);

  const value = useMemo(
    () => ({
      mode,
      themeName,
      tokens,
      setMode,
    }),
    [mode, setMode, themeName, tokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

