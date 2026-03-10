import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProfileTabScreen } from '@src/screens/Tabs/ProfileTabScreen';
import { SettingsScreen } from '@src/screens/Profile/SettingsScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileTabScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

