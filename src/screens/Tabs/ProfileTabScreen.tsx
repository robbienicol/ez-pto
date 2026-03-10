import React, { useCallback } from 'react';
import { SafeAreaView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { useAuth } from '@src/state/auth/AuthProvider';
import type { ProfileStackParamList } from '@src/navigation/ProfileNavigator';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export const ProfileTabScreen: React.FC<Props> = ({ navigation }) => {
  const { userId, signOut } = useAuth();

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  const handleGoToSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 gap-4 justify-between">
          <View className="gap-3">
            <ThemedText variant="title">Profile</ThemedText>
            <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 gap-1">
              <ThemedText variant="headline">Signed in</ThemedText>
              <ThemedText variant="caption" tone="muted">
                User ID: {userId ?? '—'}
              </ThemedText>
            </View>
            <ThemedButton label="Settings" variant="secondary" onPress={handleGoToSettings} />
          </View>

          <ThemedButton label="Sign out" variant="ghost" onPress={handleSignOut} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

