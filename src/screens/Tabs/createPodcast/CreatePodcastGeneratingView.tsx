import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { useTheme } from '@src/state/theme/ThemeProvider';

import type { AudioFormat, ContentTone, LiveRadioStyle, PodcastLength } from './types';
import { FORMAT_OPTIONS, TONE_OPTIONS } from './wizardConstants';
import { liveRadioStyleLabel } from './wizardUtils';

interface CreatePodcastGeneratingViewProps {
  topic: string;
  format: AudioFormat;
  lengthMinutes: PodcastLength | null;
  tone: ContentTone | null;
  radioStyle: LiveRadioStyle | null;
}

export const CreatePodcastGeneratingView: React.FC<CreatePodcastGeneratingViewProps> = ({
  topic,
  format,
  lengthMinutes,
  tone,
  radioStyle,
}) => {
  const { tokens } = useTheme();
  const formatLabel = FORMAT_OPTIONS.find((o) => o.id === format)?.label ?? format;

  const { emoji, subline } = useMemo(() => {
    switch (format) {
      case 'radio':
        return {
          emoji: '📻',
          subline:
            'Your AI host is wiring up feeds and shaping the stream. Grok is pulling the latest signals for you.',
        };
      case 'audiobook':
        return {
          emoji: '📖',
          subline:
            'We’re compiling chapters and generating narration — almost ready to press play.',
        };
      default:
        return {
          emoji: '🎙️',
          subline:
            'Grok is researching your topic, writing the script, and mixing the episode.',
        };
    }
  }, [format]);

  const toneSummary = useMemo(() => {
    if (format === 'radio' || tone == null) return null;
    return TONE_OPTIONS.find((o) => o.value === tone)?.label ?? tone;
  }, [format, tone]);

  const trimmed = topic.trim();

  return (
    <View className="flex-1 justify-center px-6">
      <Animated.View entering={FadeIn.duration(380)}>
        <View
          style={{
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
            borderWidth: 1,
            borderRadius: 24,
            paddingVertical: 28,
            paddingHorizontal: 24,
            gap: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <View className="flex-row items-center justify-center gap-4">
            <ThemedText style={{ fontSize: 44 }}>{emoji}</ThemedText>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: tokens.colors.primary + '18',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size="large" color={tokens.colors.primary} />
            </View>
          </View>

          <View className="gap-2 items-center">
            <ThemedText variant="title" className="text-center">
              Creating your audio
            </ThemedText>
            <ThemedText variant="body" tone="muted" className="text-center">
              {subline}
            </ThemedText>
          </View>

          <View
            style={{
              backgroundColor: tokens.colors.primary + '14',
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <ThemedText variant="caption" tone="muted" className="text-center font-nunito-semibold mb-1">
              Your topic
            </ThemedText>
            <ThemedText variant="headline" className="text-center" numberOfLines={3}>
              {trimmed || '—'}
            </ThemedText>
          </View>

          <View className="flex-row flex-wrap items-center justify-center gap-2">
            <View className="bg-success/12 dark:bg-successDark/20 px-3 py-1.5 rounded-full">
              <ThemedText variant="caption" tone="success" className="font-nunito-semibold">
                {formatLabel}
              </ThemedText>
            </View>
            {format === 'radio' && radioStyle != null && (
              <View className="bg-primary/10 dark:bg-primaryDark/15 px-3 py-1.5 rounded-full">
                <ThemedText variant="caption" tone="primary" className="font-nunito-semibold">
                  {liveRadioStyleLabel(radioStyle)}
                </ThemedText>
              </View>
            )}
            {lengthMinutes != null && (
              <View className="bg-primary/10 dark:bg-primaryDark/15 px-3 py-1.5 rounded-full">
                <ThemedText variant="caption" tone="primary" className="font-nunito-semibold">
                  {lengthMinutes} min
                </ThemedText>
              </View>
            )}
            {toneSummary != null && (
              <View className="bg-border/40 dark:bg-borderDark/50 px-3 py-1.5 rounded-full max-w-full">
                <ThemedText variant="caption" tone="muted" className="font-nunito-semibold text-center">
                  {toneSummary}
                </ThemedText>
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-center gap-2 pt-1">
            <Ionicons name="time-outline" size={16} color={tokens.colors.muted} />
            <ThemedText variant="caption" tone="muted" className="text-center">
              Usually 30–60 seconds — keep this screen open.
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};
