import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import ReadySetDiscoPixelLogo from '@src/components/atoms/ReadySetDiscoLogo';

const { width } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

export function SplashAnimation({ onFinish }: Props) {
  const flash = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);
  const glowOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Flash 1:   0–170ms
    // Gap:     170–250ms
    // Flash 2: 250–400ms
    // Gap:     400–460ms
    // Flash 3: 460–1380ms (logo burns in on this one, slow fade)
    // Hold:   1380–2100ms
    // Fade:   2100–2600ms → onFinish
    flash.value = withSequence(
      withTiming(1,    { duration: 70,  easing: Easing.out(Easing.quad) }),
      withTiming(0,    { duration: 100, easing: Easing.in(Easing.quad) }),
      withTiming(0,    { duration: 80 }),
      withTiming(0.95, { duration: 60,  easing: Easing.out(Easing.quad) }),
      withTiming(0,    { duration: 90,  easing: Easing.in(Easing.quad) }),
      withTiming(0,    { duration: 60 }),
      withTiming(1,    { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(0.06, { duration: 700, easing: Easing.out(Easing.cubic) }),
      withTiming(0,    { duration: 330, easing: Easing.in(Easing.quad) }),
    );

    // Logo burns in on flash 3 (t=460ms)
    logoOpacity.value = withDelay(460, withTiming(1, { duration: 220 }));
    logoScale.value   = withDelay(460, withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.4)) }));
    glowOpacity.value = withDelay(460, withTiming(1, { duration: 420 }));

    // Fade entire overlay out after the hold
    containerOpacity.value = withDelay(
      2100,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, []);

  const flashStyle     = useAnimatedStyle(() => ({ opacity: flash.value }));
  const logoStyle      = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle      = useAnimatedStyle(() => ({ opacity: glowOpacity.value * 0.32 }));
  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={logoStyle}>
        <ReadySetDiscoPixelLogo />
      </Animated.View>
      <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glow: {
    position: 'absolute',
    width: width * 0.92,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#7A2BFF',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
});
