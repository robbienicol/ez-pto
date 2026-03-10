import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';

export const CreateTripTabScreen: React.FC = () => {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 gap-4">
          <ThemedText variant="title">Create Trip</ThemedText>
          <ThemedText variant="body" tone="muted">
            Dummy UI for now — eventually this will be a form to create a trip and invite friends.
          </ThemedText>

          <View className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 gap-3">
            <ThemedText variant="headline">Trip details</ThemedText>
            <ThemedText variant="caption" tone="muted">
              Destination, dates, and who’s coming.
            </ThemedText>
            <ThemedButton label="Create (disabled)" variant="secondary" disabled />
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
};

