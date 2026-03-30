import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { MINI_PLAYER_OVERLAP_PADDING } from '@src/components/molecules/MiniPlayer';

import type { AudioFormat, ContentTone, LiveRadioStyle, PodcastLength } from './types';
import { FORMAT_OPTIONS, TONE_OPTIONS } from './wizardConstants';
import { liveRadioStyleLabel } from './wizardUtils';

interface CreatePodcastSuccessViewProps {
  topic: string;
  lengthMinutes: PodcastLength | null;
  format: AudioFormat;
  tone: ContentTone | null;
  radioStyle: LiveRadioStyle | null;
  onCreateAnother: () => void;
}

export const CreatePodcastSuccessView: React.FC<CreatePodcastSuccessViewProps> = ({
  topic,
  lengthMinutes,
  format,
  tone,
  radioStyle,
  onCreateAnother,
}) => {
  const formatLabel = FORMAT_OPTIONS.find((o) => o.id === format)?.label ?? format;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center gap-6 px-8"
      style={{ paddingBottom: MINI_PLAYER_OVERLAP_PADDING + 24 }}
    >
      <View className="w-20 h-20 rounded-full bg-success/10 dark:bg-successDark/10 items-center justify-center">
        <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
      </View>

      <View className="gap-2 items-center">
        <ThemedText variant="title" className="text-center">
          Your audio is ready
        </ThemedText>
        <ThemedText variant="body" tone="muted" className="text-center">
          {topic}
        </ThemedText>
        <View className="flex-row flex-wrap items-center justify-center gap-2 mt-1">
          {format === 'radio' && radioStyle != null && (
            <View className="bg-success/10 dark:bg-successDark/10 px-2.5 py-1 rounded-full">
              <ThemedText variant="caption" tone="success" className="font-nunito-semibold">
                {liveRadioStyleLabel(radioStyle)}
              </ThemedText>
            </View>
          )}
          {format !== 'radio' && tone != null && (
            <View className="bg-primary/10 dark:bg-primaryDark/10 px-2.5 py-1 rounded-full">
              <ThemedText variant="caption" tone="primary" className="font-nunito-semibold">
                {TONE_OPTIONS.find((o) => o.value === tone)?.label ?? tone}
              </ThemedText>
            </View>
          )}
          <View className="bg-success/10 dark:bg-successDark/10 px-2.5 py-1 rounded-full">
            <ThemedText variant="caption" tone="success" className="font-nunito-semibold">
              {formatLabel}
            </ThemedText>
          </View>
          {lengthMinutes != null && (
            <View className="bg-primary/10 dark:bg-primaryDark/10 px-2.5 py-1 rounded-full">
              <ThemedText variant="caption" tone="primary" className="font-nunito-semibold">
                {lengthMinutes} min
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <ThemedText variant="caption" tone="muted" className="text-center">
        Head to your Library to listen.
      </ThemedText>

      <Pressable
        onPress={onCreateAnother}
        className="px-8 py-3 rounded-pill border border-border dark:border-borderDark active:opacity-70"
      >
        <ThemedText variant="headline" tone="muted">
          Create Another
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
};
