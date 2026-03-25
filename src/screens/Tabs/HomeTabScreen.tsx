import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { useTheme } from '@src/state/theme/ThemeProvider';

type ChannelFormat = 'live' | 'podcast';

interface Channel {
  id: string;
  topic: string;
  format: ChannelFormat;
  sources: string[];
  listeners?: number;
  episodes?: number;
  emoji: string;
}

const FEATURED: Channel = {
  id: 'featured',
  topic: 'Bitcoin & Crypto Markets',
  format: 'live',
  sources: ['@cz_binance', '@saylor', '#bitcoin', '#BTC'],
  listeners: 3241,
  emoji: '₿',
};

const TRENDING_TOPICS = [
  '#Bitcoin', '#AI', '#NBA', '#Tesla', '#OpenAI',
  '#StartupNews', '#XRP', '#UFC',
];

const CHANNELS: Channel[] = [
  { id: '1', topic: 'AI & Machine Learning', format: 'podcast', sources: ['@sama', '@karpathy'], episodes: 24, emoji: '🤖' },
  { id: '2', topic: 'NBA Live Updates', format: 'live', sources: ['@wojespn', '#NBA'], listeners: 5641, emoji: '🏀' },
  { id: '3', topic: 'Startup News Daily', format: 'podcast', sources: ['@paulg', '@jason'], episodes: 12, emoji: '🚀' },
  { id: '4', topic: 'Tech Industry', format: 'live', sources: ['#tech', '@benedictevans'], listeners: 890, emoji: '💻' },
];

function LiveDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={style} className="w-2 h-2 rounded-full bg-danger dark:bg-dangerDark" />;
}

function FormatBadge({ format }: { format: ChannelFormat }) {
  const { tokens } = useTheme();

  if (format === 'live') {
    return (
      <View className="flex-row items-center gap-1.5 bg-danger/10 dark:bg-dangerDark/10 px-2.5 py-1 rounded-full border border-danger/30 dark:border-dangerDark/30">
        <LiveDot />
        <ThemedText variant="caption" tone="danger" className="font-nunito-bold">
          LIVE
        </ThemedText>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5 bg-success/10 dark:bg-successDark/10 px-2.5 py-1 rounded-full border border-success/30 dark:border-successDark/30">
      <Ionicons name="headset-outline" size={11} color={tokens.colors.success} />
      <ThemedText variant="caption" tone="success" className="font-nunito-bold">
        PODCAST
      </ThemedText>
    </View>
  );
}

function FeaturedCard({ channel }: { channel: Channel }) {
  const { tokens } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      className="mx-6 bg-surface dark:bg-surfaceDark border border-primary/30 dark:border-primaryDark/30 rounded-3xl p-5 gap-4"
    >
      <View className="flex-row items-start justify-between">
        <View className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primaryDark/10 items-center justify-center">
          <ThemedText style={{ fontSize: 32 }}>{channel.emoji}</ThemedText>
        </View>
        <FormatBadge format={channel.format} />
      </View>

      <View className="gap-1">
        <ThemedText variant="title">{channel.topic}</ThemedText>
        <ThemedText variant="caption" tone="muted">
          {channel.sources.join(' · ')}
        </ThemedText>
      </View>

      <View className="flex-row items-center justify-between pt-2 border-t border-border dark:border-borderDark">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="headset-outline" size={14} color={tokens.colors.muted} />
          <ThemedText variant="caption" tone="muted">
            {channel.listeners?.toLocaleString()} listening now
          </ThemedText>
        </View>
        <Pressable
          className="flex-row items-center gap-2 bg-primary dark:bg-primaryDark px-4 py-2.5 rounded-full active:opacity-80"
          accessibilityRole="button"
        >
          <Ionicons name="play" size={14} color="white" />
          <ThemedText variant="caption" className="text-white font-nunito-bold">
            Play
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function TrendingChip({ topic, onPress }: { topic: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark px-3.5 py-2 rounded-full active:opacity-70"
    >
      <ThemedText variant="caption" className="font-nunito-semibold">
        {topic}
      </ThemedText>
    </Pressable>
  );
}

function ChannelCardInner({ channel }: { channel: Channel }) {
  const { tokens } = useTheme();

  const meta = useMemo(
    () =>
      channel.format === 'live'
        ? `${channel.listeners?.toLocaleString()} listening`
        : `${channel.episodes} episodes`,
    [channel],
  );

  return (
    <Pressable className="flex-row items-center gap-3 bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 active:opacity-80">
      <View className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primaryDark/10 items-center justify-center">
        <ThemedText style={{ fontSize: 22 }}>{channel.emoji}</ThemedText>
      </View>
      <View className="flex-1 gap-1">
        <ThemedText variant="headline">{channel.topic}</ThemedText>
        <ThemedText variant="caption" tone="muted">
          {meta}
        </ThemedText>
      </View>
      <View className="items-end gap-2">
        <FormatBadge format={channel.format} />
        <Ionicons name="chevron-forward" size={16} color={tokens.colors.muted} />
      </View>
    </Pressable>
  );
}

const ChannelCard = memo(ChannelCardInner);

export const DiscoverTabScreen: React.FC = () => {
  const handleTopicPress = useCallback((_topic: string) => {
    // will navigate to search with topic pre-filled
  }, []);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-6 pb-4 gap-0.5">
            <ThemedText variant="caption" tone="muted">
              Good evening
            </ThemedText>
            <ThemedText variant="title">Discover</ThemedText>
          </Animated.View>

          {/* Featured Channel */}
          <FeaturedCard channel={FEATURED} />

          {/* Trending Topics */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} className="mt-6 gap-3">
            <ThemedText variant="headline" className="px-6">
              Trending on X
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
            >
              {TRENDING_TOPICS.map((topic) => (
                <TrendingChip key={topic} topic={topic} onPress={() => handleTopicPress(topic)} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* Popular Channels */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(400)}
            className="mt-6 gap-3 px-6"
          >
            <ThemedText variant="headline">Popular right now</ThemedText>
            <View className="gap-3">
              {CHANNELS.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};
