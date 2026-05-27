import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@src/screens/Home/HomeScreen';
import { QuizScreen } from '@src/screens/Quiz/QuizScreen';
import { ResultsScreen } from '@src/screens/Results/ResultsScreen';

export type AppStackParamList = {
  Home: undefined;
  Quiz: undefined;
  Results: { answers: Record<string, string> };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};
