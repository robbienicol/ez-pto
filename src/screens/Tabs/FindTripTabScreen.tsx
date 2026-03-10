import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';

export const FindTripTabScreen: React.FC = () => {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 gap-4">
          <ThemedText variant="title">Find Trip</ThemedText>
          <ThemedText variant="body" tone="muted">
            Placeholder for searching trips you’ve been invited to, or filtering by destination/date.
          </ThemedText>

          <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 gap-2">
            <ThemedText variant="headline">Search</ThemedText>
            <ThemedText variant="caption" tone="muted">
              (Search input goes here)
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

