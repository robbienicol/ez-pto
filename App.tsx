import './global.css';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PostHogProvider } from 'posthog-react-native';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import * as SplashScreen from 'expo-splash-screen';

import '@src/nativewindInterop';
import { queryClient } from '@src/api/client/queryClient';
import { RootNavigator } from '@src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from '@src/state/theme/ThemeProvider';
import { ArtistPreferencesProvider } from '@src/state/artistPreferences/ArtistPreferencesProvider';
SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { themeName } = useTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <PostHogProvider apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''} options={{ host: 'https://us.i.posthog.com', captureScreens: false, debug: __DEV__ }}>
          <ArtistPreferencesProvider>
            <RootNavigator />
            <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
          </ArtistPreferencesProvider>
        </PostHogProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Righteous_400Regular,
    VT323_400Regular,
  });
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider initialMode="dark">
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
