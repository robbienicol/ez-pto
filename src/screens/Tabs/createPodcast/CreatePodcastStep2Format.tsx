import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@src/components/atoms/ThemedText';

import type { AudioFormat } from './types';
import { FORMAT_OPTIONS } from './wizardConstants';

interface CreatePodcastStep2FormatProps {
  format: AudioFormat;
  /** Selecting a card jumps to the next step (format + advance). */
  onPickFormat: (f: AudioFormat) => void;
}

export const CreatePodcastStep2Format: React.FC<CreatePodcastStep2FormatProps> = ({
  format,
  onPickFormat,
}) => {
  return (
    <View className="gap-6">
      <View className="gap-1">
        <ThemedText variant="title">Choose your audio style</ThemedText>
        <ThemedText variant="body" tone="muted">
          Tap a style to continue — then sound (or live radio flavor) and length when it applies.
        </ThemedText>
      </View>

      <View className="gap-4">
        {FORMAT_OPTIONS.map((opt) => {
          const selected = format === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onPickFormat(opt.id)}
              className={`rounded-3xl p-5 gap-3 border active:opacity-80 ${
                selected
                  ? `${opt.selectedBg} ${opt.selectedBorder}`
                  : 'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    selected ? opt.iconBg : 'bg-primary/5 dark:bg-primaryDark/5'
                  }`}
                >
                  <ThemedText style={{ fontSize: 24 }}>{opt.emoji}</ThemedText>
                </View>
                {selected && (
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${opt.checkBg}`}
                  >
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </View>

              <View className="gap-1">
                <ThemedText variant="headline">{opt.label}</ThemedText>
                <ThemedText variant="caption" tone="muted">
                  {opt.description}
                </ThemedText>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {opt.tags.map((tag) => (
                  <View key={tag} className={`px-2.5 py-1 rounded-full ${opt.iconBg}`}>
                    <ThemedText
                      variant="caption"
                      tone={opt.tagTone}
                      className="font-nunito-semibold"
                    >
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
