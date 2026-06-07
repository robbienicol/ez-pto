import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, Text, View, ScrollView } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { usePersonality } from '@src/api/hooks/usePersonality';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Personality'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');

const ACCENT: Record<string, string> = {
  pink:   '#FF4DB3',
  purple: '#BF5FFF',
  blue:   '#00B8FF',
  gold:   '#FFD700',
  green:  '#00E676',
};

const ERA_SHORT: Record<string, string> = {
  classic:   'pre-90s',
  throwback: '90s / 00s',
  recent:    '2010s',
  now:       'right now',
  surprise:  'any era',
};

const SCENARIO_SHORT: Record<string, string> = {
  singalong: 'hits only',
  popular:   'mix it up',
  deep_cuts: 'deep cuts only',
};

// Pixel stars — fractional positions converted to absolute px at load time
const RAW_STARS: [number, number, number, string, string][] = [
  // [leftFrac, topFrac, size, color, char]
  [0.06, 0.03, 14, '#FF4DB3', '✦'],
  [0.80, 0.05,  9, '#FF4DB3', '★'],
  [0.40, 0.07,  6, '#FFFFFF', '✦'],
  [0.89, 0.10,  8, '#BF5FFF', '✦'],
  [0.02, 0.13, 10, '#FF4DB3', '✦'],
  [0.62, 0.15,  5, '#FFFFFF', '✧'],
  [0.92, 0.20, 11, '#FF4DB3', '★'],
  [0.14, 0.22,  6, '#BF5FFF', '✦'],
  [0.50, 0.19, 18, '#FF4DB3', '☽'], // crescent moon
  [0.79, 0.28,  7, '#FFFFFF', '✦'],
  [0.02, 0.30, 13, '#FF4DB3', '✦'],
  [0.95, 0.36,  8, '#FF4DB3', '✦'],
  [0.07, 0.42,  5, '#FFFFFF', '✧'],
  [0.85, 0.45, 10, '#BF5FFF', '★'],
  [0.01, 0.50,  6, '#FF4DB3', '✦'],
  [0.91, 0.55,  8, '#FFFFFF', '✦'],
  [0.04, 0.62, 11, '#FF4DB3', '✦'],
  [0.87, 0.68,  6, '#BF5FFF', '✦'],
  [0.03, 0.75,  8, '#FFFFFF', '✧'],
  [0.83, 0.79, 13, '#FF4DB3', '★'],
  [0.09, 0.84,  6, '#BF5FFF', '✦'],
  [0.76, 0.89,  8, '#FF4DB3', '✦'],
  [0.34, 0.93, 10, '#FFFFFF', '✦'],
];

const PIXEL_STARS = RAW_STARS.map(([lf, tf, size, color, char]) => ({
  left: lf * SW,
  top:  tf * SH,
  size,
  color,
  char,
}));

// ─── Pixel column ─────────────────────────────────────────────────────────────

const CAPITAL_H = 12; // 7 + 5
const BASE_H    = 12; // 5 + 7
const SEG_H     = 8;  // 7px block + 1px gap
const SHAFT_COUNT = Math.ceil((SH - CAPITAL_H - BASE_H) / SEG_H);

function PixelColumn({ side, color }: { side: 'left' | 'right'; color: string }) {
  const dim = (c: string, opacity: string) => c + opacity;
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, [side]: 3, alignItems: 'center' }}>
      {/* capital */}
      <View style={{ width: 28, height: 7, backgroundColor: color }} />
      <View style={{ width: 22, height: 5, backgroundColor: color }} />
      {/* shaft */}
      {Array.from({ length: SHAFT_COUNT }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i % 2 === 0 ? 18 : 14,
            height: 7,
            backgroundColor: i % 2 === 0 ? color : dim(color, '44'),
            marginBottom: 1,
          }}
        />
      ))}
      {/* base */}
      <View style={{ width: 22, height: 5, backgroundColor: color }} />
      <View style={{ width: 28, height: 7, backgroundColor: color }} />
    </View>
  );
}

// ─── Pixel arch ───────────────────────────────────────────────────────────────

function PixelArch({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 4 }}>
      <View style={{
        width: 96,
        height: 118,
        borderTopLeftRadius: 48,
        borderTopRightRadius: 48,
        borderWidth: 3,
        borderColor: color,
        borderBottomWidth: 0,
        backgroundColor: '#10006E',
        overflow: 'hidden',
        alignItems: 'center',
        paddingTop: 14,
        gap: 7,
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 9, letterSpacing: 10 }}>✦  ✦</Text>
        <Text style={{ color: '#FF4DB3', fontSize: 7, letterSpacing: 14 }}>✦    ✦</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 13 }}>✦</Text>
        <Text style={{ color: '#FF4DB3', fontSize: 7, letterSpacing: 10 }}>✦  ✦</Text>
        <Text style={{ color: '#BF5FFF', fontSize: 10 }}>✦</Text>
      </View>
      {/* steps */}
      <View style={{ width: 96, height: 5, backgroundColor: color }} />
      <View style={{ width: 74, height: 5, backgroundColor: color + 'AA', marginTop: 3 }} />
      <View style={{ width: 52, height: 5, backgroundColor: color + '55', marginTop: 3 }} />
    </View>
  );
}

// ─── RPG dialogue box ─────────────────────────────────────────────────────────

function RPGBox({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <View style={{ borderWidth: 3, borderColor: color, backgroundColor: '#07001A', width: '100%' }}>
      <View style={{
        borderWidth: 1,
        borderColor: color + '44',
        margin: 4,
        padding: 20,
        gap: 14,
        alignItems: 'center',
      }}>
        {children}
      </View>
    </View>
  );
}

// ─── Pixel chip ───────────────────────────────────────────────────────────────

function PixelChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{
      borderWidth: 1,
      borderColor: color,
      paddingHorizontal: 10,
      paddingVertical: 3,
      backgroundColor: color + '18',
    }}>
      <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 16, color }}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const PersonalityScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;
  const { data: personality, status } = usePersonality(answers);

  const [displayedTitle, setDisplayedTitle] = useState('');
  const [typingDone, setTypingDone]         = useState(false);
  const [showCursor, setShowCursor]         = useState(true);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardRef   = useRef<ViewShotRef>(null);

  const boxOpacity     = useSharedValue(0);
  const boxTranslateY  = useSharedValue(28);
  const subtitleOpacity = useSharedValue(0);
  const chipsOpacity   = useSharedValue(0);

  useEffect(() => {
    if (!personality) return;

    boxOpacity.value    = withTiming(1, { duration: 400 });
    boxTranslateY.value = withTiming(0, { duration: 400 });

    let i = 0;
    typingRef.current = setInterval(() => {
      i++;
      setDisplayedTitle(personality.title.slice(0, i));
      if (i >= personality.title.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        setTypingDone(true);
        subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
        chipsOpacity.value    = withDelay(500, withTiming(1, { duration: 500 }));
      }
    }, 55);

    cursorRef.current = setInterval(() => setShowCursor(c => !c), 480);

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
      if (cursorRef.current) clearInterval(cursorRef.current);
    };
  }, [personality, boxOpacity, boxTranslateY, subtitleOpacity, chipsOpacity]);

  useEffect(() => {
    if (!typingDone) return;
    const t = setTimeout(() => {
      if (cursorRef.current) clearInterval(cursorRef.current);
      setShowCursor(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [typingDone]);

  const boxAnimStyle      = useAnimatedStyle(() => ({ opacity: boxOpacity.value, transform: [{ translateY: boxTranslateY.value }] }));
  const subtitleAnimStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const chipsAnimStyle    = useAnimatedStyle(() => ({ opacity: chipsOpacity.value }));

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    const uri = await cardRef.current.capture();
    await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your music personality' });
  }, []);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const accent      = '#FF4DB3';
  const columnColor = accent + '55';

  // ── Loading ────────────────────────────────────────────────────────────────

  if (status === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: '#04001A' }}>
        {PIXEL_STARS.map((s, i) => (
          <Text key={i} style={{ position: 'absolute', top: s.top, left: s.left, fontSize: s.size, color: s.color }}>
            {s.char}
          </Text>
        ))}
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
            <Image source={require('../../../assets/lisa-dancing.gif')}  style={{ width: 160, height: 120 }} contentFit="contain" />
            <Image source={require('../../../assets/kirby-dancing.gif')} style={{ width: 100, height: 100 }} contentFit="contain" />
          </View>
          <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 30, color: '#FF4DB3', textAlign: 'center', letterSpacing: 1 }}>
            READING YOUR VIBE...
          </Text>
          <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 20, color: '#ffffff66', textAlign: 'center' }}>
            calculating your music DNA
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!personality) return null;

  const eraLabel     = ERA_SHORT[answers.era];
  const scenarioLabel = SCENARIO_SHORT[answers.listening_scenario];

  // ── Reveal ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: '#04001A' }}>

      {/* Scattered pixel stars */}
      {PIXEL_STARS.map((s, i) => (
        <Text key={i} style={{ position: 'absolute', top: s.top, left: s.left, fontSize: s.size, color: s.color }}>
          {s.char}
        </Text>
      ))}

      {/* Pixel columns */}
      <PixelColumn side="left"  color={columnColor} />
      <PixelColumn side="right" color={columnColor} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 40,
            paddingTop: 14,
            paddingBottom: 36,
            alignItems: 'center',
            gap: 18,
          }}
          showsVerticalScrollIndicator={false}
        >

          {/* Screen label */}
          <Text style={{
            fontFamily: 'VT323_400Regular',
            fontSize: 15,
            color: '#ffffff44',
            letterSpacing: 3,
            textAlign: 'center',
          }}>
            YOUR MUSIC PERSONALITY
          </Text>

          {/* Shareable card */}
          <ViewShot
            ref={cardRef}
            options={{ format: 'png', quality: 1 }}
            style={{ width: '100%', backgroundColor: '#04001A', padding: 20, gap: 18, alignItems: 'center' }}
          >
            <PixelArch color={accent} />

            {/* RPG dialogue box — fades in + slides up */}
            <Animated.View style={[{ width: '100%' }, boxAnimStyle]}>
              <RPGBox color={accent}>
                <Text style={{
                  fontFamily: 'VT323_400Regular',
                  fontSize: 25,
                  color: accent,
                  textAlign: 'center',
                  lineHeight: 52,
                  textShadowColor: accent,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 20,
                }}>
                  {displayedTitle}
                  {!typingDone && showCursor ? '▮' : ''}
                </Text>

                <Animated.Text style={[{
                  fontFamily: 'VT323_400Regular',
                  fontSize: 20,
                  color: '#FFFFFFCC',
                  textAlign: 'center',
                  lineHeight: 26,
                }, subtitleAnimStyle]}>
                  {personality.subtitle}
                </Animated.Text>
              </RPGBox>
            </Animated.View>

            {/* Stat chips */}
            {/* <Animated.View style={[{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }, chipsAnimStyle]}>

              {scenarioLabel ? <PixelChip label={`💎 ${scenarioLabel}`}  color={accent} /> : null}
            </Animated.View> */}

            {/* Branding */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Image source={require('../../../assets/logo.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
              <Image source={require('../../../assets/logo.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
              <Image source={require('../../../assets/logo.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
              <Image source={require('../../../assets/logo.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
              <Image source={require('../../../assets/logo.png')} style={{ width: 52, height: 52 }} contentFit="contain" />
            </View>
          </ViewShot>

          {/* Buttons */}
          <View style={{ width: '100%', flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <View style={{ flex: 1 }}>
            <ThemedButton label="Back" variant="secondary" onPress={handleDone} />

            </View>
            <View style={{ flex: 1 }}>
            <ThemedButton label="Share" variant="primary" onPress={handleShare} />

            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
