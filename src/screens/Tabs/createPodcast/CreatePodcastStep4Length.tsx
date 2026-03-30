import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { useTheme } from '@src/state/theme/ThemeProvider';

import type { AudioFormat, ContentTone, PodcastLength } from './types';
import { FORMAT_OPTIONS, LENGTH_OPTIONS, TONE_OPTIONS } from './wizardConstants';

interface CreatePodcastStep4LengthProps {
  topic: string;
  format: AudioFormat;
  tone: ContentTone;
  length: PodcastLength;
  /** Sets length and shows generate confirmation alert. */
  onPickLength: (l: PodcastLength) => void;
}

export const CreatePodcastStep4Length: React.FC<CreatePodcastStep4LengthProps> = ({
  topic,
  format,
  tone,
  length,
  onPickLength,
}) => {
  const { tokens } = useTheme();
  const formatLabel = FORMAT_OPTIONS.find((o) => o.id === format)?.label ?? format;
  const toneLabel = TONE_OPTIONS.find((o) => o.value === tone)?.label ?? tone;
  const lengthRowLabel =
    LENGTH_OPTIONS.find((o) => o.value === length)?.label ?? `${length} min`;

  return (
    <View className="gap-6">
      <View className="gap-1">
        <ThemedText variant="title">Almost there</ThemedText>
        <ThemedText variant="body" tone="muted">
          Here’s what you chose. Tap a length to confirm — we’ll ask before generating.
        </ThemedText>
      </View>

      <View
        style={{
          backgroundColor: tokens.colors.surface,
          borderWidth: 1,
          borderColor: tokens.colors.border,
          borderRadius: 20,
          padding: 16,
          gap: 12,
        }}
      >
        <ThemedText variant="caption" tone="muted" className="font-nunito-semibold">
          YOUR SELECTIONS
        </ThemedText>
        <View className="gap-2">
          <View className="flex-row gap-2">
            <ThemedText variant="caption" tone="muted" style={{ width: 88 }}>
              Topic
            </ThemedText>
            <ThemedText variant="body" className="flex-1">
              {topic.trim() || '—'}
            </ThemedText>
          </View>
          <View className="flex-row gap-2">
            <ThemedText variant="caption" tone="muted" style={{ width: 88 }}>
              Format
            </ThemedText>
            <ThemedText variant="body" className="flex-1">
              {formatLabel}
            </ThemedText>
          </View>
          <View className="flex-row gap-2">
            <ThemedText variant="caption" tone="muted" style={{ width: 88 }}>
              Sound
            </ThemedText>
            <ThemedText variant="body" className="flex-1">
              {toneLabel}
            </ThemedText>
          </View>
          <View className="flex-row gap-2">
            <ThemedText variant="caption" tone="muted" style={{ width: 88 }}>
              Length
            </ThemedText>
            <ThemedText variant="body" className="flex-1">
              {lengthRowLabel}
              <ThemedText variant="caption" tone="muted">
                {' '}
                (tap below to change)
              </ThemedText>
            </ThemedText>
          </View>
        </View>
      </View>

      <View className="gap-1">
        <ThemedText variant="headline">How long?</ThemedText>
        <ThemedText variant="caption" tone="muted">
          Tap a length to confirm and generate.
        </ThemedText>
      </View>

      <View className="gap-3">
        {LENGTH_OPTIONS.map((opt) => {
          const selected = length === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onPickLength(opt.value)}
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
                <View className="flex-row items-baseline gap-2">
                  <ThemedText variant="headline">{opt.label}</ThemedText>
                  <ThemedText variant="caption" tone="muted">
                    {opt.sublabel}
                  </ThemedText>
                </View>
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
