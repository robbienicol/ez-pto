import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import { OnboardingScreen } from '@src/screens/Onboarding/OnboardingScreen';
import { HomeScreen } from '@src/screens/Home/HomeScreen';
import { QuizScreen } from '@src/screens/Quiz/QuizScreen';
import { PersonalityScreen } from '@src/screens/Personality/PersonalityScreen';
import { FullReportScreen } from '@src/screens/FullReport/FullReportScreen';

export type AppStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Quiz: undefined;
  Personality: { answers: Record<string, string> };
  FullReport: { answers: Record<string, string> };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Home' | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_done').then(val => {
      setInitialRoute(val ? 'Home' : 'Onboarding');
    });
  }, []);

  if (!initialRoute) return null;

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="Personality" component={PersonalityScreen} />
      <Stack.Screen name="FullReport" component={FullReportScreen} />
    </Stack.Navigator>
  );
};
