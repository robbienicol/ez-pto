import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@src/screens/Home/HomeScreen';
import { QuizScreen } from '@src/screens/Quiz/QuizScreen';
import { PersonalityScreen } from '@src/screens/Personality/PersonalityScreen';
import { ResultsScreen } from '@src/screens/Results/ResultsScreen';

export type AppStackParamList = {
  Home: undefined;
  Quiz: undefined;
  Personality: { answers: Record<string, string> };
  Results: { answers: Record<string, string> };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="Personality" component={PersonalityScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};
