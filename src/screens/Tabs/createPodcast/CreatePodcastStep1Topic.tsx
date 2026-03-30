import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { useTheme } from '@src/state/theme/ThemeProvider';

import { QUICK_PICKS } from './wizardConstants';

interface CreatePodcastStep1TopicProps {
  topic: string;
  onChangeTopic: (t: string) => void;
  /** Choosing a chip jumps to the next step (topic + advance). */
  onPickQuickTopic: (t: string) => void;
  /** Typed topic — continue without a quick pick. */
  onContinue: () => void;
}

export const CreatePodcastStep1Topic: React.FC<CreatePodcastStep1TopicProps> = ({
  topic,
  onChangeTopic,
  onPickQuickTopic,
  onContinue,
}) => {
  const { tokens } = useTheme();

  return (
    <View className="gap-6">
      <View className="gap-1">
        <ThemedText variant="title">What's your story?</ThemedText>
        <ThemedText variant="body" tone="muted">
          Grok will research X and build your audio around this topic.
        </ThemedText>
      </View>

      <TextInput
        value={topic}
        onChangeText={onChangeTopic}
        placeholder="e.g. Bitcoin halving, GPT-5 release, NBA playoffs..."
        placeholderTextColor={tokens.colors.muted}
        style={{
          fontFamily: 'Nunito_400Regular',
          fontSize: 16,
          color: tokens.colors.foreground,
          backgroundColor: tokens.colors.surface,
          borderWidth: 1,
          borderColor: topic.length > 0 ? tokens.colors.primary : tokens.colors.border,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
        autoCorrect={false}
        autoCapitalize="words"
      />

      <View className="gap-3">
        <ThemedText variant="caption" tone="muted" className="font-nunito-semibold">
          QUICK PICKS
        </ThemedText>
        <View className="flex-row flex-wrap gap-2">
          {QUICK_PICKS.map((pick) => {
            const selected = topic === pick.label;
            return (
              <Pressable
                key={pick.label}
                onPress={() => onPickQuickTopic(pick.label)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border active:opacity-70 ${
                  selected
                    ? 'bg-primary dark:bg-primaryDark border-primary dark:border-primaryDark'
                    : 'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark'
                }`}
              >
                <ThemedText style={{ fontSize: 13 }}>{pick.emoji}</ThemedText>
                <ThemedText
                  variant="caption"
                  className="font-nunito-semibold"
                  style={{ color: selected ? '#FFFFFF' : tokens.colors.foreground }}
                >
                  {pick.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {topic.trim().length > 0 && (
        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          style={{
            marginTop: 8,
            paddingVertical: 16,
            borderRadius: 9999,
            alignItems: 'center',
            backgroundColor: tokens.colors.primary,
          }}
        >
          <Text
            style={{
              fontFamily: 'Nunito_600SemiBold',
              fontSize: 18,
              color: '#FFFFFF',
            }}
          >
            Continue
          </Text>
        </Pressable>
      )}
    </View>
  );
};
