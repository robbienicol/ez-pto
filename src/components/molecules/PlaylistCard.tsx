import React, { useCallback } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import type { PlaylistResult } from '@src/api/hooks/usePlaylistRecommendation';
import { useSavedPlaylists } from '@src/state/savedPlaylists/SavedPlaylistsProvider';

const PLATFORM_LABEL: Record<string, string> = {
  spotify: 'OPEN IN SPOTIFY →',
  apple:   'OPEN IN APPLE MUSIC →',
  youtube: 'OPEN ON YOUTUBE →',
};

interface PlaylistCardProps {
  playlist: PlaylistResult;
  accent: string;
  showRemove?: boolean;
}

export function PlaylistCard({ playlist, accent, showRemove = false }: PlaylistCardProps) {
  const { savePlaylist, removePlaylist } = useSavedPlaylists();

  const handlePress = useCallback(() => {
    savePlaylist(playlist);
    if (playlist.platform === 'spotify') {
      Linking.openURL(`spotify://playlist/${playlist.id}`).catch(() => Linking.openURL(playlist.url));
    } else if (playlist.platform === 'apple') {
      Linking.openURL(playlist.url.replace('https://', 'music://')).catch(() => Linking.openURL(playlist.url));
    } else {
      Linking.openURL(playlist.url);
    }
  }, [playlist, savePlaylist]);

  const handleRemove = useCallback(() => {
    removePlaylist(playlist.id);
  }, [playlist.id, removePlaylist]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      style={{ borderColor: accent + '88', borderWidth: 1.5, borderRadius: 14, overflow: 'hidden' }}
      className="active:opacity-70"
    >
      {playlist.thumbnailUrl ? (
        <Image
          source={{ uri: playlist.thumbnailUrl }}
          style={{ width: '100%', aspectRatio: 1 }}
          contentFit="cover"
        />
      ) : null}
      <View style={{ padding: 14, gap: 4, backgroundColor: '#0A0120' }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' }} numberOfLines={2}>
          {playlist.name}
        </Text>
        {playlist.description ? (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 }} numberOfLines={2}>
            {playlist.description}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: accent, letterSpacing: 2 }}>
            {PLATFORM_LABEL[playlist.platform] ?? 'OPEN →'}
          </Text>
          {showRemove && (
            <Pressable
              onPress={handleRemove}
              hitSlop={8}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
                REMOVE
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
