import React, { useCallback, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { StarryScreen } from '@src/components/atoms/StarryScreen';
import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { usePlaylistRecommendation, type GeneratedSong } from '@src/api/hooks/usePlaylistRecommendation';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Results'>;

function SongRow({ song, index }: { song: GeneratedSong; index: number }) {
  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-border dark:border-borderDark">
      <ThemedText variant="caption" tone="muted" style={{ minWidth: 24, textAlign: 'right' }}>
        {index + 1}
      </ThemedText>
      <View className="flex-1">
        <ThemedText variant="headline" numberOfLines={1}>{song.title}</ThemedText>
        <ThemedText variant="caption" tone="muted" numberOfLines={1}>{song.artist}</ThemedText>
      </View>
    </View>
  );
}

export const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;
  const { disconnect } = useSpotifyAuth();

  const { data: playlist, status, error, refetch } = usePlaylistRecommendation(answers);
  const [showShareModal, setShowShareModal] = useState(false);

  const goToQuiz = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Quiz' }] });
  }, [navigation]);

  const handleStartOver = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleShare = useCallback(async () => {
    await Share.share({
      message: "Hey! Try this free app — it asks you a few questions about your vibe and builds you a personalised Spotify playlist 🎵 It's genuinely good and takes 30 seconds.",
    });
    setShowShareModal(false);
    goToQuiz();
  }, [goToQuiz]);

  const handleAlreadyShared = useCallback(() => {
    setShowShareModal(false);
    goToQuiz();
  }, [goToQuiz]);

  const handleOpenPlaylist = useCallback(() => {
    if (!playlist) return;
    const uri = `spotify://playlist/${playlist.id}`;
    Linking.canOpenURL(uri).then(canOpen =>
      Linking.openURL(canOpen ? uri : playlist.external_urls.spotify),
    );
  }, [playlist]);

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
            Building your playlist...
          </ThemedText>
          <ThemedText variant="caption" tone="muted" className="text-center">
            picking songs, searching Spotify, creating your playlist
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
            {error?.message ?? 'Could not create playlist'}
          </ThemedText>
          <ThemedButton label="Try again" variant="primary" onPress={() => refetch()} />
          <ThemedButton label="Start over" variant="ghost" onPress={handleStartOver} />
        </SafeAreaView>
      </StarryScreen>
    );
  }

  if (!playlist) return null;

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
          </View>

          {/* Playlist card */}
          <Pressable
            onPress={handleOpenPlaylist}
            accessibilityRole="button"
            style={{ borderColor: '#FF4DB3' }}
            className="bg-surface dark:bg-surfaceDark border-2 rounded-2xl overflow-hidden active:opacity-70"
          >
     
            <View className="p-4 gap-2">
              <ThemedText variant="title" numberOfLines={2}>{playlist.name}</ThemedText>
              {playlist.description ? (
                <ThemedText variant="caption" tone="muted" numberOfLines={2}>
                  {playlist.description}
                </ThemedText>
              ) : null}
              <View className="flex-row items-center justify-between mt-1">
                <ThemedText variant="caption" tone="muted">
                  {playlist.tracks.total} tracks · created for you
                </ThemedText>
                <View style={{ backgroundColor: '#FF4DB3' }} className="px-3 py-1 rounded-pill">
                  <ThemedText variant="caption" style={{ color: '#fff' }}>Open in Spotify</ThemedText>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Track list */}
          <View>
            <ThemedText variant="headline" className="mb-2">
              {playlist.tracks.total} songs
            </ThemedText>
            {playlist.songs.filter(s => s.uri !== null).map((song, i) => (
              <SongRow key={`${song.title}-${i}`} song={song} index={i} />
            ))}
          </View>

          {/* Actions */}
          <View className="gap-3 mt-2">
            <ThemedButton label="Make another playlist" variant="primary" onPress={handleStartOver} />
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
