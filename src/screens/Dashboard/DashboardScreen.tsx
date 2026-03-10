import React, { useCallback } from 'react';
import { SafeAreaView, View } from 'react-native';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { useAuth } from '@src/state/auth/AuthProvider';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 justify-between">
          <ThemedText variant="title">Dashboard</ThemedText>
          <ThemedButton label="Sign out" variant="ghost" onPress={handleSignOut} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};
