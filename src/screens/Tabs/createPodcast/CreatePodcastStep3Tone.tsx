import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { useTheme } from '@src/state/theme/ThemeProvider';

import type { ContentTone } from './types';
import { TONE_OPTIONS } from './wizardConstants';

interface CreatePodcastStep3ToneProps {
  tone: ContentTone;
  /** Sets tone and advances to the length step. */
  onPickTone: (t: ContentTone) => void;
}

export const CreatePodcastStep3Tone: React.FC<CreatePodcastStep3ToneProps> = ({
  tone,
  onPickTone,
}) => {
  const { tokens } = useTheme();

  return (
    <View className="gap-6">
      <View className="gap-1">
        <ThemedText variant="title">How should it sound?</ThemedText>
        <ThemedText variant="body" tone="muted">
          Pick one style — tap to continue and choose length.
        </ThemedText>
      </View>

      <View className="gap-3">
        {TONE_OPTIONS.map((opt) => {
          const selected = tone === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onPickTone(opt.value)}
              className={`flex-row items-center gap-4 rounded-2xl p-4 border active:opacity-80 ${
                selected
                  ? 'bg-primary/10 dark:bg-primaryDark/10 border-primary/40 dark:border-primaryDark/40'
                  : 'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark'
              }`}
            >
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center ${
                  selected ? 'bg-primary dark:bg-primaryDark' : 'bg-primary/10 dark:bg-primaryDark/10'
                }`}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={selected ? '#FFFFFF' : tokens.colors.primary}
                />
              </View>

              <View className="flex-1">
                <ThemedText variant="headline">{opt.label}</ThemedText>
                <ThemedText variant="caption" tone="muted">
                  {opt.description}
                </ThemedText>
              </View>

              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selected ? tokens.colors.primary : tokens.colors.border,
                  backgroundColor: selected ? tokens.colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
