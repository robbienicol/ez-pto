import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';

export const HomeTabScreen: React.FC = () => {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 gap-4">
          <ThemedText variant="title">Home</ThemedText>
          <ThemedText variant="body" tone="muted">
            This is a placeholder home tab. We can show upcoming trips, invites, and quick actions here.
          </ThemedText>

          <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 gap-2">
            <ThemedText variant="headline">Next up</ThemedText>
            <ThemedText variant="body" tone="muted">
              No trips yet — create one from the Create Trip tab.
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

