import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { useTheme } from '@src/state/theme/ThemeProvider';

// Mock currently-playing state — replace with Zustand store when wiring up audio
const NOW_PLAYING = {
  topic: 'Bitcoin & Crypto Markets',
  format: 'live' as const,
  emoji: '₿',
};

const BAR_COUNT = 5;
const BAR_DELAYS = [0, 120, 60, 200, 80];
const BAR_DURATIONS = [400, 500, 350, 450, 380];

function WaveformBar({ index }: { index: number }) {
  const height = useSharedValue(4);

  useEffect(() => {
    height.value = withDelay(
      BAR_DELAYS[index],
      withRepeat(
        withSequence(
          withTiming(18, { duration: BAR_DURATIONS[index] }),
          withTiming(4, { duration: BAR_DURATIONS[index] }),
        ),
        -1,
        false,
      ),
    );
  }, [height, index]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[style, { width: 3, borderRadius: 2 }]}
      className="bg-primary dark:bg-primaryDark"
    />
  );
}

function Waveform() {
  return (
    <View className="flex-row items-center gap-0.5" style={{ height: 24 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveformBar key={i} index={i} />
      ))}
    </View>
  );
}

export const MiniPlayer: React.FC = () => {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  // Tab bar height: standard 49px + device bottom inset
  const TAB_BAR_HEIGHT = 49 + insets.bottom;

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: TAB_BAR_HEIGHT + 8,
      }}
    >
      <View
        style={{
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Channel icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: tokens.colors.primary + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ThemedText style={{ fontSize: 18 }}>{NOW_PLAYING.emoji}</ThemedText>
        </View>

        {/* Topic + waveform */}
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText variant="caption" className="font-nunito-bold" numberOfLines={1}>
            {NOW_PLAYING.topic}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Waveform />
            <ThemedText variant="caption" tone="danger" className="font-nunito-bold">
              LIVE
            </ThemedText>
          </View>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable
            accessibilityRole="button"
            style={{ padding: 6 }}
          >
            <Ionicons name="play-skip-back-outline" size={20} color={tokens.colors.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: tokens.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="pause" size={18} color="white" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={{ padding: 6 }}
          >
            <Ionicons name="play-skip-forward-outline" size={20} color={tokens.colors.muted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
