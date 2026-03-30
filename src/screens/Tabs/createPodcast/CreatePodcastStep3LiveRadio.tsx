import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { useTheme } from '@src/state/theme/ThemeProvider';

import type { LiveRadioStyle } from './types';
import { LIVE_RADIO_OTHER_STYLES } from './wizardConstants';

interface CreatePodcastStep3LiveRadioProps {
  radioStyle: LiveRadioStyle;
  onSelect: (s: LiveRadioStyle) => void;
}

export const CreatePodcastStep3LiveRadio: React.FC<CreatePodcastStep3LiveRadioProps> = ({
  radioStyle,
  onSelect,
}) => {
  const { tokens } = useTheme();
  const sportsSelected = radioStyle === 'sports';

  return (
    <View className="gap-6">
      <View className="gap-1">
        <ThemedText variant="title">Live radio style</ThemedText>
        <ThemedText variant="body" tone="muted">
          Pick how the stream should feel. Sports is built for games and fan chatter.
        </ThemedText>
      </View>

      <Pressable
        onPress={() => onSelect('sports')}
        className={`rounded-3xl p-5 gap-3 border-2 active:opacity-90 ${
          sportsSelected
            ? 'bg-success/15 dark:bg-successDark/20 border-success dark:border-successDark'
            : 'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark'
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="bg-success/20 dark:bg-successDark/25 px-2 py-0.5 rounded-full">
              <ThemedText variant="caption" tone="success" className="font-nunito-bold">
                Featured
              </ThemedText>
            </View>
          </View>
          {sportsSelected && (
            <View className="w-6 h-6 rounded-full bg-success dark:bg-successDark items-center justify-center">
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View className="flex-row items-start gap-3">
          <ThemedText style={{ fontSize: 36 }}>🏟️</ThemedText>
          <View className="flex-1 gap-2">
            <ThemedText variant="headline">Sports radio</ThemedText>
            <ThemedText variant="body" tone="muted">
              Play-by-play energy with scores, injuries, and what fans are saying right now.
            </ThemedText>
            <View className="bg-primary/10 dark:bg-primaryDark/15 rounded-2xl px-3 py-2.5 gap-1">
              <ThemedText variant="caption" tone="primary" className="font-nunito-semibold">
                ESPN + X (Twitter)
              </ThemedText>
              <ThemedText variant="caption" tone="muted">
                We pull the latest from ESPN game feeds and play-by-play, plus what’s blowing up on X, so
                your stream stays live.
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>

      <View className="gap-2">
        <ThemedText variant="caption" tone="muted" className="font-nunito-semibold">
          OTHER LIVE STYLES
        </ThemedText>
        <View className="gap-3">
          {LIVE_RADIO_OTHER_STYLES.map((opt) => {
            const selected = radioStyle === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onSelect(opt.value)}
                className={`flex-row items-center gap-4 rounded-2xl p-4 border active:opacity-80 ${
                  selected
                    ? 'bg-success/10 dark:bg-successDark/15 border-success/50 dark:border-successDark/50'
                    : 'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark'
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center ${
                    selected ? 'bg-success dark:bg-successDark' : 'bg-success/10 dark:bg-successDark/10'
                  }`}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={selected ? '#FFFFFF' : tokens.colors.success}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <ThemedText variant="headline">
                    {opt.emoji} {opt.label}
                  </ThemedText>
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
                    borderColor: selected ? tokens.colors.success : tokens.colors.border,
                    backgroundColor: selected ? tokens.colors.success : 'transparent',
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
    </View>
  );
};
