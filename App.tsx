import './global.css';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import { queryClient } from '@src/api/client/queryClient';
import { RootNavigator } from '@src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from '@src/state/theme/ThemeProvider';

function AppShell() {
  const { themeName } = useTheme();

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
