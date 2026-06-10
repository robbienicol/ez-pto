import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const { width: SW } = Dimensions.get('window');

const ACCENT_COLORS: Record<string, string> = {
  pink:   '#FF4DB3',
  purple: '#BF5FFF',
  blue:   '#00B8FF',
  gold:   '#FFD700',
  green:  '#00E676',
};

// ─── Pixel column ─────────────────────────────────────────────────────────────

const { height: SH } = Dimensions.get('window');
const SEG_H = 8;
const CAPITAL_H = 12;
const BASE_H = 12;
const SHAFT_COUNT = Math.ceil((SH - CAPITAL_H - BASE_H) / SEG_H);

function PixelColumn({ side, color }: { side: 'left' | 'right'; color: string }) {
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, [side]: 3, alignItems: 'center' }}>
      <View style={{ width: 28, height: 7, backgroundColor: color }} />
      <View style={{ width: 22, height: 5, backgroundColor: color }} />
      {Array.from({ length: SHAFT_COUNT }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i % 2 === 0 ? 18 : 14,
            height: 7,
            backgroundColor: i % 2 === 0 ? color : color + '44',
            marginBottom: 1,
          }}
        />
      ))}
      <View style={{ width: 22, height: 5, backgroundColor: color }} />
      <View style={{ width: 28, height: 7, backgroundColor: color }} />
    </View>
  );
}

// ─── RPG dialogue box ─────────────────────────────────────────────────────────

function RPGBox({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <View style={{ borderWidth: 3, borderColor: color, backgroundColor: '#07001A', width: '100%' }}>
      <View style={{ borderWidth: 1, borderColor: color + '44', margin: 4, padding: 20, gap: 14, alignItems: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const PersonalityScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers } = route.params;
  const { data: personality, status } = usePersonality(answers);

  const [displayedTitle, setDisplayedTitle] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const boxOpacity      = useSharedValue(0);
  const boxTranslateY   = useSharedValue(28);
  const subtitleOpacity = useSharedValue(0);
  const lockedOpacity   = useSharedValue(0);

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
        lockedOpacity.value   = withDelay(600, withTiming(1, { duration: 500 }));
      }
    }, 55);

    cursorRef.current = setInterval(() => setShowCursor(c => !c), 480);

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
      if (cursorRef.current) clearInterval(cursorRef.current);
    };
  }, [personality, boxOpacity, boxTranslateY, subtitleOpacity, lockedOpacity]);

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
  const lockedAnimStyle   = useAnimatedStyle(() => ({ opacity: lockedOpacity.value }));

  const handleUnlock = useCallback(() => {
    navigation.navigate('FullReport', { answers });
  }, [navigation, answers]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const accent = personality ? (ACCENT_COLORS[personality.color] ?? '#BF5FFF') : '#BF5FFF';
  const columnColor = accent + '55';

  if (status === 'pending') {
    return (
      <View style={{ flex: 1, backgroundColor: '#04001A' }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 }}>
          <ActivityIndicator size="large" color="#BF5FFF" />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#BF5FFF', textAlign: 'center' }}>
            Reading your vibe...
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#ffffff55', textAlign: 'center' }}>
            Building your music identity
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (status === 'error' || !personality) {
    return (
      <View style={{ flex: 1, backgroundColor: '#04001A' }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FF4DB3', textAlign: 'center' }}>
            Something went wrong
          </Text>
          <ThemedButton label="Go back" variant="ghost" onPress={handleBack} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#04001A' }}>
      <PixelColumn side="left"  color={columnColor} />
      <PixelColumn side="right" color={columnColor} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 40, paddingTop: 14, paddingBottom: 40, alignItems: 'center', gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#ffffff44', letterSpacing: 3, textAlign: 'center' }}>
            YOUR MUSIC IDENTITY
          </Text>

          <Animated.View style={[{ width: '100%' }, boxAnimStyle]}>
            <RPGBox color={accent}>
              <Text style={{
                fontFamily: 'Inter_800ExtraBold',
                fontSize: SW < 380 ? 26 : 30,
                color: accent,
                textAlign: 'center',
                lineHeight: 40,
                textShadowColor: accent,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 20,
              }}>
                {displayedTitle}
                {!typingDone && showCursor ? '▮' : ''}
              </Text>

              <Animated.Text style={[{
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                color: '#FFFFFFCC',
                textAlign: 'center',
                lineHeight: 24,
              }, subtitleAnimStyle]}>
                {personality.subtitle}
              </Animated.Text>
            </RPGBox>
          </Animated.View>

          <Animated.View style={[{ width: '100%', gap: 12 }, lockedAnimStyle]}>
            <ThemedButton
              label="See my full report →"
              variant="primary"
              onPress={handleUnlock}
            />
            <ThemedButton
              label="Go back"
              variant="ghost"
              onPress={handleBack}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
