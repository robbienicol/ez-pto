import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import { AuthNavigator } from '@src/navigation/AuthNavigator';
import { AppNavigator } from '@src/navigation/AppNavigator';
import { AuthProvider } from '@src/state/auth/AuthProvider';

export const RootNavigator: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-backgroundDark">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      {isSignedIn ? <AppNavigator /> : <AuthNavigator />}
    </AuthProvider>
  );
};
