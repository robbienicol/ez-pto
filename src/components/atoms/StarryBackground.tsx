import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const STAR_COLORS = [
  '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF',
  '#FF69B4', '#FF69B4',
  '#C0A8FF',
  '#FFD700',
];

interface StarData {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  twinkleDuration: number;
  twinkleDelay: number;
  baseOpacity: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateStars(count: number): StarData[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => seededRandom(i * 17 + n);
    return {
      id: i,
      x: r(0) * 100,
      y: r(1) * 100,
      size: r(2) < 0.6 ? 1.5 : r(2) < 0.85 ? 2.5 : 3.5,
      color: STAR_COLORS[Math.floor(r(3) * STAR_COLORS.length)],
      twinkleDuration: 1200 + r(4) * 2000,
      twinkleDelay: r(5) * 3000,
      baseOpacity: 0.4 + r(6) * 0.6,
    };
  });
}

function TwinkleStar({ star }: { star: StarData }) {
  const opacity = useSharedValue(star.baseOpacity);

  useEffect(() => {
    opacity.value = withDelay(
      star.twinkleDelay,
      withRepeat(
        withSequence(
          withTiming(0.1, { duration: star.twinkleDuration }),
          withTiming(star.baseOpacity, { duration: star.twinkleDuration }),
        ),
        -1,
        true,
      ),
    );
  }, [opacity, star.baseOpacity, star.twinkleDelay, star.twinkleDuration]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
          borderRadius: star.size,
          backgroundColor: star.color,
        },
      ]}
    />
  );
}

interface StarryBackgroundProps {
  count?: number;
}

export function StarryBackground({ count = 70 }: StarryBackgroundProps) {
  const stars = useMemo(() => generateStars(count), [count]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map(star => (
        <TwinkleStar key={star.id} star={star} />
      ))}
    </View>
  );
}
