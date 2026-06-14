import React, { useCallback, useEffect, useRef } from 'react';
import { Image, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedButton } from '@src/components/atoms/ThemedButton';
import { ThemedText } from '@src/components/atoms/ThemedText';
import { StarryScreen } from '@src/components/atoms/StarryScreen';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

// ─── Pixel art disco ball ──────────────────────────────────────────────────────

const CELL_SIZE = 7;

// 0 = transparent, 1 = dark border, 2 = shadow tile, 3 = mid tile,
// 4 = silver tile, 5 = bright tile, 6 = pink, 7 = blue, 8 = gold
const DISCO_BALL_PIXELS: number[][] = [
  [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 5, 4, 5, 4, 1, 1, 0, 0],
  [0, 1, 4, 5, 3, 5, 3, 5, 4, 3, 1, 0],
  [1, 5, 3, 4, 5, 3, 5, 3, 4, 5, 3, 1],
  [1, 4, 5, 3, 4, 5, 4, 5, 3, 4, 5, 1],
  [1, 3, 4, 5, 2, 4, 2, 4, 5, 2, 4, 1],
  [1, 5, 2, 4, 6, 2, 8, 7, 2, 5, 2, 1],
  [1, 4, 3, 2, 4, 3, 2, 4, 3, 4, 3, 1],
  [1, 2, 4, 3, 2, 4, 3, 2, 4, 2, 4, 1],
  [0, 1, 3, 2, 3, 2, 3, 2, 3, 2, 1, 0],
  [0, 0, 1, 1, 3, 2, 3, 2, 1, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
];

const PIXEL_COLORS: Record<number, string> = {
  1: '#0d0820',
  2: '#2d3055',
  3: '#5d6090',
  4: '#9aa0c8',
  5: '#dde0ff',
  6: '#FF4DB3',
  7: '#00B8FF',
  8: '#FFD700',
};

function DiscoBall() {
  const { width: screenW } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const range = screenW * 0.35;
    translateX.value = -range;
    translateX.value = withRepeat(
      withSequence(
        withTiming(range, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-range, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 2500, easing: Easing.linear }),
      -1,
      false,
    );
  }, [screenW, translateX, rotate]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          shadowColor: '#9aa0c8',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 6,
        },
      ]}
    >
      {DISCO_BALL_PIXELS.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row' }}>
          {row.map((c, ci) => (
            <View
              key={ci}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: c === 0 ? 'transparent' : PIXEL_COLORS[c],
              }}
            />
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Feature chip ─────────────────────────────────────────────────────────────

function FeatureChip({ label, color, index }: { label: string; color: string; index: number }) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(700 + index * 120, withSpring(1, { damping: 12 }));
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style} className={`flex-row items-center gap-2 px-4 py-2.5 rounded-pill ${color} border`}>
      <ThemedText variant="caption" className="font-nunito-extrabold">{label}</ThemedText>
    </Animated.View>
  );
}



const SPIRAL_MS = 560;

// ─── Screen ───────────────────────────────────────────────────────────────────

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const spiralRotate = useSharedValue(0);
  const spiralScale = useSharedValue(1);
  const spiralOpacity = useSharedValue(1);
  const isTransitioning = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      spiralRotate.value = 0;
      spiralScale.value = 1;
      spiralOpacity.value = 1;
      isTransitioning.current = false;
    }, [spiralOpacity, spiralRotate, spiralScale]),
  );

  const spiralStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [
      { rotate: `${spiralRotate.value}deg` },
      { scale: spiralScale.value },
    ],
    opacity: spiralOpacity.value,
  }));

  const handlePress = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    spiralScale.value = withSequence(
      withTiming(1.06, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: SPIRAL_MS, easing: Easing.in(Easing.cubic) }),
    );
    spiralRotate.value = withTiming(900, {
      duration: SPIRAL_MS + 90,
      easing: Easing.in(Easing.quad),
    });
    spiralOpacity.value = withDelay(
      (SPIRAL_MS + 90) * 0.55,
      withTiming(0, { duration: (SPIRAL_MS + 90) * 0.45, easing: Easing.in(Easing.quad) }),
    );

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      navigation.navigate('Quiz');
    }, SPIRAL_MS + 90);
  }, [navigation, spiralOpacity, spiralRotate, spiralScale]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Animated.View style={spiralStyle}>
        <StarryScreen>
          <SafeAreaView className="flex-1">
            <View className="flex-1 px-6 pt-6 pb-10 justify-between">

              <Animated.View
                entering={FadeInDown.delay(100).duration(500)}
                style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}
              >
                <DiscoBall />
              </Animated.View>

              <View className="items-center gap-3 mt-6">
                <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} className="items-center">
                  <Image
                    source={require('../../../assets/logo.png')}
                    style={{ width: 400, height: 256 }}
                    resizeMode="contain"
                  />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(380).duration(500).springify()} className="w-full">
                  <View
                    style={{
                      shadowColor: '#FF69B4',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.65,
                      shadowRadius: 18,
                      elevation: 10,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: 'rgba(10, 5, 35, 0.9)',
                        borderWidth: 1.5,
                        borderColor: '#E91E8C',
                        borderRadius: 18,
                        paddingVertical: 20,
                        paddingHorizontal: 24,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inter_700Bold',
                          fontSize: 22,
                          lineHeight: 32,
                          color: '#FFFFFF',
                          textAlign: 'center',
                        }}
                      >
                        {'Answer '}
                        <Text style={{ color: '#FFD700' }}>10 questions</Text>
                        {'.\nDiscover your music identity.'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              </View>

        

              <Animated.View
                entering={FadeInUp.delay(900).duration(500).springify()}
                className="gap-3 mt-8"
              >
                <ThemedButton
                  label="Let's go"
                  variant="primary"
                  showSelectionCursor
                  onPress={handlePress}
                />
              </Animated.View>

            </View>
          </SafeAreaView>
        </StarryScreen>
      </Animated.View>
    </View>
  );
};
