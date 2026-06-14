import React, { useCallback, useRef } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { DancingLoader } from '@src/components/atoms/DancingLoader';
import { PlaylistCard } from '@src/components/molecules/PlaylistCard';
import { usePersonality } from '@src/api/hooks/usePersonality';
import { usePlaylistRecommendation } from '@src/api/hooks/usePlaylistRecommendation';
import { useAnalytics } from '@src/analytics';
import { useSavedPlaylists } from '@src/state/savedPlaylists/SavedPlaylistsProvider';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'FullReport'>;

const ACCENT_COLORS: Record<string, string> = {
  pink:   '#FF4DB3',
  purple: '#BF5FFF',
  blue:   '#00B8FF',
  gold:   '#FFD700',
  green:  '#00E676',
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 3, height: 18, backgroundColor: accent, borderRadius: 2 }} />
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: accent, letterSpacing: 3 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const FullReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;
  const { data: personality, status: personalityStatus } = usePersonality(answers);
  const { data: playlistResult, status: playlistStatus, refetch } = usePlaylistRecommendation(answers);
  const analytics = useAnalytics();
  const { markQuizCompleted } = useSavedPlaylists();
  const trackedRef = useRef(false);

  React.useEffect(() => {
    markQuizCompleted();
  }, [markQuizCompleted]);

  React.useEffect(() => {
    if (playlistStatus === 'success' && playlistResult && !trackedRef.current) {
      trackedRef.current = true;
      analytics.playlistGenerated(playlistResult.playlists.length);
    }
  }, [playlistStatus, playlistResult, analytics]);

  const handleShare = useCallback(async () => {
    analytics.shareClicked();
    await Share.share({
      message: `I just found my music identity with Ready Set Disco — I'm ${personality?.title ?? 'a vibe curator'}. Takes 2 minutes and tells you exactly what you should be listening to. Try it.`,
    });
  }, [analytics, personality]);

  const handleRetake = useCallback(() => {
    analytics.retakeClicked();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [analytics, navigation]);

  const accent = personality ? (ACCENT_COLORS[personality.color] ?? '#BF5FFF') : '#BF5FFF';
  const isLoading = personalityStatus === 'pending' || playlistStatus === 'pending';
  const hasError  = personalityStatus === 'error' || playlistStatus === 'error';

  if (isLoading) {
    return <DancingLoader title="Building your report..." subtitle="Finding your playlists and music direction" />;
  }

  if (hasError || !personality) {
    return (
      <View style={{ flex: 1, backgroundColor: '#04001A' }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FF4DB3', textAlign: 'center' }}>
            Something went wrong
          </Text>
          {/* <ThemedButton label="Try again" variant="primary" onPress={() => refetch()} /> */}
          <ThemedButton label="Start over" variant="ghost" onPress={handleRetake} />
        </SafeAreaView>
      </View>
    );
  }

  const playlists = playlistResult?.playlists ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#04001A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Identity card (shareable) ── */}
          <View style={{
            margin: 20,
            borderWidth: 1.5,
            borderColor: accent + '66',
            borderRadius: 24,
            backgroundColor: accent + '0D',
            padding: 28,
            gap: 16,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 24,
            elevation: 8,
          }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: accent, letterSpacing: 3 }}>
              YOUR MUSIC IDENTITY
            </Text>
            <Text style={{
              fontFamily: 'Inter_800ExtraBold',
              fontSize: 32,
              color: accent,
              lineHeight: 38,
              textShadowColor: accent,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }}>
              {personality.title}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 24 }}>
              {personality.subtitle}
            </Text>

            {/* Share button inside card */}
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                alignSelf: 'flex-start',
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 50,
                borderWidth: 1.5,
                borderColor: accent + '88',
                backgroundColor: pressed ? accent + '22' : 'transparent',
                marginTop: 4,
              })}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: accent }}>
                Share my identity
              </Text>
              <Text style={{ fontSize: 14 }}>↗</Text>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 24, gap: 32 }}>

            {/* ── Music identity ── */}
            <View style={{ gap: 12 }}>
              <SectionHeader label="MUSIC IDENTITY" accent={accent} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 24 }}>
                {personality.musicIdentity}
              </Text>
              {personality.growthDirection ? (
                <View style={{ borderLeftWidth: 2, borderLeftColor: accent + '66', paddingLeft: 14 }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 22, fontStyle: 'italic' }}>
                    {personality.growthDirection}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* ── Artists to explore ── */}
            {personality.artistsToExplore.length > 0 && (
              <View style={{ gap: 14 }}>
                <SectionHeader label="ARTISTS TO EXPLORE" accent={accent} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {personality.artistsToExplore.map((artist, i) => (
                    <View key={i} style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 50,
                      borderWidth: 1.5,
                      borderColor: accent + '55',
                      backgroundColor: accent + '10',
                    }}>
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#FFFFFF' }}>
                        {artist}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Blind spot ── */}
            {personality.blindSpot ? (
              <View style={{ gap: 14 }}>
                <SectionHeader label="YOUR BLIND SPOT" accent={accent} />
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  padding: 18,
                }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 24 }}>
                    {personality.blindSpot}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* ── Playlists ── */}
            <View style={{ gap: 14 }}>
              <SectionHeader label="YOUR PLAYLISTS" accent={accent} />
              {playlists.length > 0 ? (
                playlists.map(p => (
                  <PlaylistCard key={p.id} playlist={p} accent={accent} />
                ))
              ) : (
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                  No playlists found — try again?
                </Text>
              )}
            </View>

            {/* ── Actions ── */}
            <View style={{ gap: 12 }}>
              <ThemedButton label="Take it again" variant="ghost" onPress={handleRetake} />
              <ThemedButton label="Try again" variant="ghost" onPress={() => refetch()} />
            </View>

            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
              @readysetdisco on TikTok
            </Text>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
