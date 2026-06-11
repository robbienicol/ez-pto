import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StarryScreen } from '@src/components/atoms/StarryScreen';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Onboarding'>;

const CARDS = [
  {
    emoji: '🎧',
    accent: '#BF5FFF',
    glow: 'rgba(191,95,255,0.35)',
    circleBg: 'rgba(191,95,255,0.1)',
    title: 'Who are you?',
    body: 'Answer some quick questions about your personality, lifestyle, and what you\'re drawn to.',
  },
  {
    emoji: '✨',
    accent: '#FF4DB3',
    glow: 'rgba(255,77,179,0.35)',
    circleBg: 'rgba(255,77,179,0.1)',
    title: 'AI reads your vibe.',
    body: 'We go beyond what you already play — and tell you exactly what you should be hearing.',
  },
  {
    emoji: '🎶',
    accent: '#FFD700',
    glow: 'rgba(255,215,0,0.35)',
    circleBg: 'rgba(255,215,0,0.1)',
    title: 'Your full listening guide.',
    body: 'Your music archetype, genres to explore, and 3 Spotify playlists built for your sound.',
  },
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const CIRCLE_SIZE = width * 0.62;
  const isLast = page === CARDS.length - 1;

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  }, [width]);

  const handleStart = useCallback(async () => {
    await SecureStore.setItemAsync('onboarding_done', '1');
    navigation.replace('Home');
  }, [navigation]);

  return (
    <StarryScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>

          {/* Swipeable slides */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            style={{ flex: 1 }}
          >
            {CARDS.map((card, i) => (
              <View key={i} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'space-around', paddingVertical: 24 }}>

                {/* Graphic circle — top half */}
                <View style={{
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  borderRadius: CIRCLE_SIZE / 2,
                  backgroundColor: card.circleBg,
                  borderWidth: 1.5,
                  borderColor: card.accent + '44',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: card.accent,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 40,
                  elevation: 10,
                }}>
                  {/* Inner ring */}
                  <View style={{
                    width: CIRCLE_SIZE * 0.72,
                    height: CIRCLE_SIZE * 0.72,
                    borderRadius: CIRCLE_SIZE,
                    borderWidth: 1,
                    borderColor: card.accent + '30',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: CIRCLE_SIZE * 0.28 }}>
                      {card.emoji}
                    </Text>
                  </View>

                  {/* Decorative corner brackets */}
                  {[
                    { top: 24, left: 24 },
                    { top: 24, right: 24 },
                    { bottom: 24, left: 24 },
                    { bottom: 24, right: 24 },
                  ].map((pos, j) => (
                    <View key={j} style={{
                      position: 'absolute',
                      ...pos,
                      width: 22,
                      height: 22,
                      borderColor: card.accent,
                      borderTopWidth: j < 2 ? 2 : 0,
                      borderBottomWidth: j >= 2 ? 2 : 0,
                      borderLeftWidth: j % 2 === 0 ? 2 : 0,
                      borderRightWidth: j % 2 === 1 ? 2 : 0,
                    }} />
                  ))}
                </View>

                {/* Text — bottom half */}
                <View style={{ paddingHorizontal: 36, gap: 12, alignItems: 'center' }}>
                  <Text style={{
                    fontFamily: 'Inter_800ExtraBold',
                    fontSize: 28,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    lineHeight: 36,
                  }}>
                    {card.title}
                  </Text>
                  <Text style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center',
                    lineHeight: 24,
                  }}>
                    {card.body}
                  </Text>
                </View>

              </View>
            ))}
          </ScrollView>

          {/* Fixed bottom: dots + button */}
          <View style={{ paddingHorizontal: 28, paddingBottom: 36, gap: 28, alignItems: 'center' }}>

            {/* Dots */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {CARDS.map((c, i) => (
                <View
                  key={i}
                  style={{
                    height: 6,
                    width: i === page ? 24 : 6,
                    borderRadius: 3,
                    backgroundColor: i === page ? CARDS[page].accent : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </View>

            {/* CTA — only on last slide */}
            {isLast ? (
              <Pressable
                onPress={handleStart}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  width: '100%',
                  backgroundColor: pressed ? '#CC3D99' : '#FF4DB3',
                  paddingVertical: 17,
                  borderRadius: 50,
                  alignItems: 'center',
                  shadowColor: '#FF4DB3',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 18,
                  elevation: 8,
                })}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFFFFF' }}>
                  Get started
                </Text>
              </Pressable>
            ) : (
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                color: 'rgba(255,255,255,0.2)',
              }}>
                Swipe to continue
              </Text>
            )}

          </View>

        </View>
      </SafeAreaView>
    </StarryScreen>
  );
};
