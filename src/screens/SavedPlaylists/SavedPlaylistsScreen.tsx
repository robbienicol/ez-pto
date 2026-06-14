import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaylistCard } from '@src/components/molecules/PlaylistCard';
import { useSavedPlaylists } from '@src/state/savedPlaylists/SavedPlaylistsProvider';

const ACCENT = '#BF5FFF';

export const SavedPlaylistsScreen: React.FC = () => {
  const { savedPlaylists } = useSavedPlaylists();

  return (
    <View style={{ flex: 1, backgroundColor: '#04001A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, gap: 20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 28, color: '#FFFFFF', marginBottom: 4 }}>
            Saved Playlists
          </Text>

          {savedPlaylists.length === 0 ? (
            <View style={{ paddingTop: 48, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                No saved playlists yet
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                Tap any playlist in your report to save it here
              </Text>
            </View>
          ) : (
            savedPlaylists.map(p => (
              <PlaylistCard key={p.id} playlist={p} accent={ACCENT} showRemove />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
