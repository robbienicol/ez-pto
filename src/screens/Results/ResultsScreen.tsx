import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { StarryScreen } from '@src/components/atoms/StarryScreen';
import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { usePlaylistRecommendation, type SpotifyPlaylistResult } from '@src/api/hooks/usePlaylistRecommendation';
import { useAnalytics } from '@src/analytics';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Results'>;

function PlaylistCard({ playlist }: { playlist: SpotifyPlaylistResult }) {
  const coverUrl = playlist.images?.[0]?.url;

  const handleOpen = useCallback(() => {
    Linking.openURL(`spotify://playlist/${playlist.id}`).catch(() => {
      Linking.openURL(playlist.external_urls.spotify);
    });
  }, [playlist]);

  return (
    <Pressable
      onPress={handleOpen}
      accessibilityRole="button"
      style={{ borderColor: '#FF4DB3' }}
      className="bg-surface dark:bg-surfaceDark border-2 rounded-2xl overflow-hidden active:opacity-70"
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{ width: '100%', aspectRatio: 1 }}
          contentFit="cover"
        />
      ) : (
        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#1a0a3a' }} />
      )}
      <View className="p-4 gap-1.5">
        <ThemedText variant="title" numberOfLines={2}>{playlist.name}</ThemedText>
        {playlist.description ? (
          <ThemedText variant="caption" tone="muted" numberOfLines={2}>
            {playlist.description}
          </ThemedText>
        ) : null}
        <View className="flex-row items-center justify-between mt-1">
          <ThemedText variant="caption" tone="muted">
            {playlist.tracks?.total != null ? `${playlist.tracks.total} tracks · ` : ''}{playlist.owner.display_name}
          </ThemedText>
          <View style={{ backgroundColor: '#FF4DB3' }} className="px-3 py-1 rounded-pill">
            <ThemedText variant="caption" style={{ color: '#fff' }}>Open</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;
  const { disconnect } = useSpotifyAuth();

  const { data: result, status, error, refetch } = usePlaylistRecommendation(answers);
  const analytics = useAnalytics();
  const [showShareModal, setShowShareModal] = useState(false);
  const [rating, setRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const trackedGenerated = useRef(false);

  useEffect(() => {
    if (status === 'success' && result && !trackedGenerated.current) {
      trackedGenerated.current = true;
      analytics.playlistGenerated(result.playlists.length);
    }
  }, [status, result, analytics]);

  const goToQuiz = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [navigation]);

  const handleStartOver = useCallback(() => {
    analytics.retakeClicked();
    setShowShareModal(true);
  }, [analytics]);

  const handleShare = useCallback(async () => {
    analytics.shareClicked();
    await Share.share({
      message: "Hey! Try this free app — it asks you a few questions about your vibe and finds you the perfect Spotify playlist 🎵 Takes 30 seconds.",
    });
    setShowShareModal(false);
    goToQuiz();
  }, [analytics, goToQuiz]);

  const handleAlreadyShared = useCallback(() => {
    setShowShareModal(false);
    goToQuiz();
  }, [goToQuiz]);

  const handleRate = useCallback((value: 'thumbs_up' | 'thumbs_down') => {
    if (rating !== null) return;
    setRating(value);
    analytics.playlistRated(value);
  }, [rating, analytics]);

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
            Finding your playlists...
          </ThemedText>
          <ThemedText variant="caption" tone="muted" className="text-center">
            reading your vibe, searching Spotify
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
            {error?.message ?? 'Could not find playlists'}
          </ThemedText>
          <ThemedButton label="Try again" variant="primary" onPress={() => refetch()} />
          <ThemedButton label="Start over" variant="ghost" onPress={handleStartOver} />
        </SafeAreaView>
      </StarryScreen>
    );
  }

  if (!result) return null;

  return (
    <StarryScreen>
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 24, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="gap-1">
            <ThemedText variant="caption" tone="muted">your vibe, your playlist</ThemedText>
            <ThemedText variant="display">Ready Set Disco 🪩</ThemedText>
            <ThemedText variant="body" tone="muted" style={{ marginTop: 4 }}>
              Searched: "{result.searchQuery}"
            </ThemedText>
          </View>

          {/* Playlist cards */}
          {result.playlists.length > 0 ? (
            result.playlists.map(playlist => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))
          ) : (
            <View className="items-center gap-3 py-8">
              <ThemedText variant="body" tone="muted" className="text-center">
                No playlists found for this vibe. Try again?
              </ThemedText>
            </View>
          )}

          {/* Rating */}
          {result.playlists.length > 0 && (
            <View className="items-center gap-3">
              <ThemedText variant="caption" tone="muted">
                {rating === null ? 'did you like your playlist?' : rating === 'thumbs_up' ? 'glad you liked it!' : 'noted — we\'ll do better'}
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Pressable
                  onPress={() => handleRate('thumbs_up')}
                  accessibilityLabel="Thumbs up"
                  style={{
                    opacity: rating !== null && rating !== 'thumbs_up' ? 0.3 : 1,
                    borderWidth: 2,
                    borderColor: '#00E676',
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    backgroundColor: rating === 'thumbs_up' ? 'rgba(0, 230, 118, 0.2)' : 'transparent',
                  }}
                >
                  <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 28, color: '#00E676', letterSpacing: 1 }}>
                    [[ YES ]]
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRate('thumbs_down')}
                  accessibilityLabel="Thumbs down"
                  style={{
                    opacity: rating !== null && rating !== 'thumbs_down' ? 0.3 : 1,
                    borderWidth: 2,
                    borderColor: '#FF4DB3',
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    backgroundColor: rating === 'thumbs_down' ? 'rgba(255, 77, 179, 0.2)' : 'transparent',
                  }}
                >
                  <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 28, color: '#FF4DB3', letterSpacing: 1 }}>
                    [[ NAH ]]
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Actions */}
          <View className="gap-3 mt-2">
            <ThemedButton label="Start over" variant="primary" onPress={handleStartOver} />
            <ThemedButton label="Disconnect Spotify" variant="ghost" onPress={handleDisconnect} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showShareModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleAlreadyShared}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', paddingHorizontal: 24 }}
          onPress={handleAlreadyShared}
        >
          <Pressable onPress={e => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: '#0A0523',
                borderWidth: 1.5,
                borderColor: '#E91E8C',
                borderRadius: 28,
                paddingHorizontal: 24,
                paddingTop: 28,
                paddingBottom: 28,
                gap: 20,
              }}
            >
              <View style={{ gap: 6 }}>
                <ThemedText variant="title" style={{ textAlign: 'center' }}>
                  Would you mind sharing this with a friend?
                </ThemedText>
                <ThemedText variant="body" tone="muted" style={{ textAlign: 'center' }}>
                  turns out AI tokens are expensive
                </ThemedText>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <ThemedButton label="Send to a friend" variant="primary" onPress={handleShare} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedButton label="I promise I just did" variant="primary" onPress={handleAlreadyShared} />
                </View>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </StarryScreen>
  );
};
