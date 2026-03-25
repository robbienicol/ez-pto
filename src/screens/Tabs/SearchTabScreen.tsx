import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { useTheme } from '@src/state/theme/ThemeProvider';

type ChannelFormat = 'live' | 'podcast';

interface SearchResult {
  id: string;
  topic: string;
  format: ChannelFormat;
  listeners: number;
  emoji: string;
}

const TRENDING_TOPICS = [
  '#Bitcoin', '#AI', '#NBA', '#Tesla', '#OpenAI',
  '#StartupNews', '#XRP', '#UFC', '#Politics', '#Climate',
];

const ALL_RESULTS: SearchResult[] = [
  { id: '1', topic: 'Bitcoin & Crypto', format: 'live', listeners: 3241, emoji: '₿' },
  { id: '2', topic: 'AI & Machine Learning', format: 'podcast', listeners: 1200, emoji: '🤖' },
  { id: '3', topic: 'NBA Live Updates', format: 'live', listeners: 5641, emoji: '🏀' },
  { id: '4', topic: 'Startup News', format: 'podcast', listeners: 890, emoji: '🚀' },
  { id: '5', topic: 'Tech Industry', format: 'live', listeners: 1340, emoji: '💻' },
  { id: '6', topic: 'Global Markets', format: 'podcast', listeners: 2100, emoji: '📈' },
];

function SearchResultCard({ result }: { result: SearchResult }) {
  const { tokens } = useTheme();

  return (
    <Pressable className="flex-row items-center gap-3 bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl p-4 active:opacity-80">
      <View className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primaryDark/10 items-center justify-center">
        <ThemedText style={{ fontSize: 22 }}>{result.emoji}</ThemedText>
      </View>
      <View className="flex-1 gap-0.5">
        <ThemedText variant="headline">{result.topic}</ThemedText>
        <ThemedText variant="caption" tone="muted">
          {result.listeners.toLocaleString()} listening
        </ThemedText>
      </View>
      <View className="items-end gap-2">
        {result.format === 'live' ? (
          <ThemedText variant="caption" tone="danger" className="font-nunito-bold">
            LIVE
          </ThemedText>
        ) : (
          <ThemedText variant="caption" tone="success" className="font-nunito-bold">
            PODCAST
          </ThemedText>
        )}
        <Pressable
          className="bg-primary/10 dark:bg-primaryDark/10 px-3 py-1.5 rounded-full active:opacity-70"
          accessibilityRole="button"
        >
          <ThemedText variant="caption" tone="primary" className="font-nunito-semibold">
            Listen
          </ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );
}

export const SearchTabScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const { tokens } = useTheme();

  const filteredResults = useMemo(
    () =>
      query.length > 0
        ? ALL_RESULTS.filter((r) => r.topic.toLowerCase().includes(query.toLowerCase()))
        : ALL_RESULTS,
    [query],
  );

  const handleClear = useCallback(() => setQuery(''), []);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Sticky search header */}
        <View className="px-6 pt-6 pb-4 gap-4">
          <ThemedText variant="title">Search</ThemedText>
          <View className="flex-row items-center gap-3 bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark rounded-2xl px-4 py-3">
            <Ionicons name="search-outline" size={20} color={tokens.colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Bitcoin, NBA, AI startups..."
              placeholderTextColor={tokens.colors.muted}
              style={{
                flex: 1,
                fontFamily: 'Nunito_400Regular',
                fontSize: 16,
                color: tokens.colors.foreground,
              }}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={handleClear} accessibilityRole="button">
                <Ionicons name="close-circle" size={20} color={tokens.colors.muted} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* Trending chips — only show when not searching */}
          {query.length === 0 && (
            <View className="gap-3 mb-6">
              <ThemedText variant="headline">Trending on X</ThemedText>
              <View className="flex-row flex-wrap gap-2">
                {TRENDING_TOPICS.map((topic) => (
                  <Pressable
                    key={topic}
                    onPress={() => setQuery(topic.replace('#', ''))}
                    className="bg-surface dark:bg-surfaceDark border border-border dark:border-borderDark px-3.5 py-2 rounded-full active:opacity-70"
                  >
                    <ThemedText variant="caption" className="font-nunito-semibold">
                      {topic}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <ThemedText variant="headline" className="mb-3">
            {query.length > 0 ? `Results for "${query}"` : 'Popular channels'}
          </ThemedText>

          {/* Results list */}
          <View className="gap-3">
            {filteredResults.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </View>

          {/* Create channel CTA when searching */}
          {query.length > 0 && (
            <Pressable
              className="mt-4 flex-row items-center justify-center gap-2 border border-dashed border-primary/40 dark:border-primaryDark/40 rounded-2xl p-4 active:opacity-70"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={20} color={tokens.colors.primary} />
              <ThemedText variant="headline" tone="primary">
                Create channel for &quot;{query}&quot;
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};
