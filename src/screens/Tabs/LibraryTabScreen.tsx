import React, { memo } from 'react';
import { SafeAreaView, ScrollView, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { useTheme } from '@src/state/theme/ThemeProvider';

type ChannelFormat = 'live' | 'podcast';

interface LibraryChannel {
  id: string;
  topic: string;
  format: ChannelFormat;
  emoji: string;
  lastPlayed: string;
  isOwned: boolean;
}

const MY_CHANNELS: LibraryChannel[] = [
  {
    id: '1',
    topic: 'Bitcoin & Crypto Markets',
    format: 'live',
    emoji: '₿',
    lastPlayed: '2 min ago',
    isOwned: true,
  },
  {
    id: '2',
    topic: 'AI & Machine Learning',
    format: 'podcast',
    emoji: '🤖',
    lastPlayed: '1 hr ago',
    isOwned: false,
  },
];

const RECENTLY_PLAYED: LibraryChannel[] = [
  { id: '3', topic: 'NBA Live Updates', format: 'live', emoji: '🏀', lastPlayed: '3 hr ago', isOwned: false },
  { id: '4', topic: 'Startup News Daily', format: 'podcast', emoji: '🚀', lastPlayed: 'Yesterday', isOwned: false },
  { id: '5', topic: 'Global Markets', format: 'podcast', emoji: '📈', lastPlayed: 'Yesterday', isOwned: false },
];

function LibraryCardInner({ channel }: { channel: LibraryChannel }) {
  const { tokens } = useTheme();

  return (
    <Pressable className="flex-row items-center gap-3 bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 active:opacity-80">
      <View className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primaryDark/10 items-center justify-center">
        <ThemedText style={{ fontSize: 22 }}>{channel.emoji}</ThemedText>
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <ThemedText variant="headline" className="flex-1" numberOfLines={1}>
            {channel.topic}
          </ThemedText>
          {channel.isOwned && (
            <View className="bg-primary/10 dark:bg-primaryDark/10 px-2 py-0.5 rounded-full">
              <ThemedText variant="caption" tone="primary" className="font-nunito-semibold">
                Mine
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText variant="caption" tone="muted">
          {channel.lastPlayed}
        </ThemedText>
      </View>
      <View className="items-end gap-2">
        {channel.format === 'live' ? (
          <ThemedText variant="caption" tone="danger" className="font-nunito-bold">
            LIVE
          </ThemedText>
        ) : (
          <ThemedText variant="caption" tone="success" className="font-nunito-bold">
            PODCAST
          </ThemedText>
        )}
        <Pressable accessibilityRole="button">
          <Ionicons name="play-circle-outline" size={28} color={tokens.colors.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const LibraryCard = memo(LibraryCardInner);

function EmptyChannels() {
  const { tokens } = useTheme();

  return (
    <View className="bg-surface dark:bg-surfaceDark border border-dashed border-border dark:border-borderDark rounded-2xl p-8 items-center gap-3">
      <Ionicons name="radio-outline" size={40} color={tokens.colors.muted} />
      <View className="items-center gap-1">
        <ThemedText variant="headline">No channels yet</ThemedText>
        <ThemedText variant="caption" tone="muted" className="text-center">
          Create your first channel and we will start generating content for you.
        </ThemedText>
      </View>
    </View>
  );
}

export const LibraryTabScreen: React.FC = () => {
  const hasChannels = MY_CHANNELS.length > 0;

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-6 pb-4 gap-0.5">
            <ThemedText variant="title">Library</ThemedText>
          </View>

          {/* My Channels */}
          <View className="gap-3 mb-6">
            <ThemedText variant="headline">My Channels</ThemedText>
            {hasChannels ? (
              <View className="gap-3">
                {MY_CHANNELS.map((channel) => (
                  <LibraryCard key={channel.id} channel={channel} />
                ))}
              </View>
            ) : (
              <EmptyChannels />
            )}
          </View>

          {/* Recently Played */}
          <View className="gap-3">
            <ThemedText variant="headline">Recently Played</ThemedText>
            <View className="gap-3">
              {RECENTLY_PLAYED.map((channel) => (
                <LibraryCard key={channel.id} channel={channel} />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};
