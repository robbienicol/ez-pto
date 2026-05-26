import React, { useCallback } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { StarryScreen } from '@src/components/atoms/StarryScreen';
import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { usePlaylistRecommendation, type SpotifyPlaylist } from '@src/api/hooks/usePlaylistRecommendation';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Results'>;

async function openPlaylist(playlist: SpotifyPlaylist) {
  const spotifyUri = `spotify://playlist/${playlist.id}`;
  const webUrl = playlist.external_urls.spotify;
  const canOpen = await Linking.canOpenURL(spotifyUri);
  Linking.openURL(canOpen ? spotifyUri : webUrl);
}

function PlaylistCard({ playlist, index }: { playlist: SpotifyPlaylist; index: number }) {
  const cover = playlist.images[0]?.url;
  const description = playlist.description?.replace(/<[^>]+>/g, '').trim();

  const handlePress = useCallback(() => openPlaylist(playlist), [playlist]);

  const CARD_ACCENTS = ['#FF4DB3', '#BF5FFF', '#00B8FF'];
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      style={{ borderColor: accent }}
      className="bg-surface dark:bg-surfaceDark border-2 rounded-2xl overflow-hidden active:opacity-70"
    >
      {cover ? (
        <Image source={{ uri: cover }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
      ) : (
        <View style={{ aspectRatio: 1 }} className="bg-primary/20 items-center justify-center">
          <ThemedText style={{ fontSize: 64 }}>🪩</ThemedText>
        </View>
      )}

      <View className="p-4 gap-1">
        <ThemedText variant="title" numberOfLines={2}>{playlist.name}</ThemedText>

        {description ? (
          <ThemedText variant="caption" tone="muted" numberOfLines={2}>{description}</ThemedText>
        ) : null}

        <View className="flex-row items-center justify-between mt-2">
          <ThemedText variant="caption" tone="muted">
            {playlist.tracks?.total != null ? `${playlist.tracks.total} tracks · ` : ''}{playlist.owner.display_name}
          </ThemedText>
          <View
            style={{ backgroundColor: accent }}
            className="px-3 py-1 rounded-pill"
          >
            <ThemedText variant="caption" style={{ color: '#fff' }}>
              Open in Spotify
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;
  const { disconnect } = useSpotifyAuth();

  const { data: playlists, status, error, refetch } = usePlaylistRecommendation(answers);

  const handleStartOver = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Quiz' }] });
  }, [navigation]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

  if (status === 'pending') {
    return (
      <StarryScreen>
        <SafeAreaView className="flex-1 items-center justify-center gap-6 px-8">
          <View className="flex-row items-end gap-4">
            <Image
              source={require('../../../assets/lisa-dancing.gif')}
              style={{ width: 160, height: 120 }}
              contentFit="contain"
            />
            <Image
              source={require('../../../assets/kirby-dancing.gif')}
              style={{ width: 100, height: 100 }}
              contentFit="contain"
            />
          </View>
          <ThemedText variant="title" className="text-center">
            Finding your perfect playlist...
          </ThemedText>
          <ThemedText variant="caption" tone="muted" className="text-center">
            asking the AI, searching Spotify
          </ThemedText>
        </SafeAreaView>
      </StarryScreen>
    );
  }

  if (status === 'error') {
    return (
      <StarryScreen>
        <SafeAreaView className="flex-1 px-6 items-center justify-center gap-4">
          <ThemedText variant="title" className="text-center">Something went wrong</ThemedText>
          <ThemedText variant="caption" tone="muted" className="text-center">
            {error?.message ?? 'Could not get recommendations'}
          </ThemedText>
          <ThemedButton label="Try again" variant="primary" onPress={() => refetch()} />
          <ThemedButton label="Start over" variant="ghost" onPress={handleStartOver} />
        </SafeAreaView>
      </StarryScreen>
    );
  }

  return (
    <StarryScreen>
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 24, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="gap-1 mb-2">
            <ThemedText variant="caption" tone="muted">your vibe, your soundtrack</ThemedText>
            <ThemedText variant="display">Ready Set Disco 🪩</ThemedText>
          </View>

          {/* Playlist cards */}
          {playlists?.map((playlist, i) => (
            <PlaylistCard key={playlist.id} playlist={playlist} index={i} />
          ))}

          {/* Actions */}
          <View className="gap-3 mt-4">
            <ThemedButton label="Take the quiz again" variant="primary" onPress={handleStartOver} />
            <ThemedButton label="Disconnect Spotify" variant="ghost" onPress={handleDisconnect} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </StarryScreen>
  );
};
