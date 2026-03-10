import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';

export const DiscoverTripsTabScreen: React.FC = () => {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 gap-4">
          <ThemedText variant="title">Discover Trips</ThemedText>
          <ThemedText variant="body" tone="muted">
            Placeholder feed for trip ideas and popular destinations.
          </ThemedText>

          <View className="gap-3">
            <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4">
              <ThemedText variant="headline">Weekend in Austin</ThemedText>
              <ThemedText variant="caption" tone="muted">
                Food, live music, and sunshine.
              </ThemedText>
            </View>
            <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4">
              <ThemedText variant="headline">Beach week</ThemedText>
              <ThemedText variant="caption" tone="muted">
                Pick dates that fit everyone’s PTO.
              </ThemedText>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

