import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import Animated, {
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
import { ThemedView } from '@src/components/atoms/ThemedView';
import type { AuthStackParamList } from '@src/navigation/AuthNavigator';

const FEATURES: { emoji: string; label: string; color: string }[] = [
  { emoji: '🗓️', label: 'Sync time off', color: 'bg-primary/10' },
  { emoji: '👯', label: 'Plan with friends', color: 'bg-sun/10' },
  { emoji: '✈️', label: 'Go together', color: 'bg-coral/10' },
];

function FloatingEmoji({
  emoji,
  delay,
  startY,
}: {
  emoji: string;
  delay: number;
  startY: number;
}) {
  const translateY = useSharedValue(startY);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startY - 12, { duration: 2200 }),
          withTiming(startY, { duration: 2200 }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, opacity, startY, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
    </Animated.View>
  );
}

function FeatureChip({
  emoji,
  label,
  color,
  index,
}: {
  emoji: string;
  label: string;
  color: string;
  index: number;
}) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(700 + index * 120, withSpring(1, { damping: 12 }));
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={style}
      className={`flex-row items-center gap-2 px-4 py-2.5 rounded-pill ${color} border border-border dark:border-borderDark`}
    >
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <ThemedText variant="caption" className="font-nunito-semibold">
        {label}
      </ThemedText>
    </Animated.View>
  );
}

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleSignIn = useCallback(() => {
    navigation.navigate('SignIn');
  }, [navigation]);

  const handleSignUp = useCallback(() => {
    navigation.navigate('SignUp');
  }, [navigation]);

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 justify-between">

          {/* Floating emoji row */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            className="flex-row justify-center gap-8 pt-4"
          >
            <FloatingEmoji emoji="🌴" delay={0} startY={0} />
            <FloatingEmoji emoji="☀️" delay={300} startY={-6} />
            <FloatingEmoji emoji="🏖️" delay={180} startY={2} />
            <FloatingEmoji emoji="✈️" delay={450} startY={-4} />
          </Animated.View>

          {/* Hero text */}
          <View className="items-center gap-3 mt-6">
            <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} className="items-center gap-1">
              <ThemedText variant="display" className="text-center leading-tight">
                Your crew's next
              </ThemedText>
              <ThemedText variant="display" className="text-center text-primary dark:text-primaryDark">
                escape 🌊
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
              <ThemedText variant="headline" tone="muted" className="text-center">
                Sync PTO, pick dates everyone loves,{'\n'}and actually go.
              </ThemedText>
            </Animated.View>
          </View>

          {/* Feature chips */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(400)}
            className="flex-row flex-wrap justify-center gap-3 mt-6"
          >
            {FEATURES.map((f, i) => (
              <FeatureChip key={f.label} {...f} index={i} />
            ))}
          </Animated.View>

          {/* CTA */}
          <Animated.View
            entering={FadeInUp.delay(900).duration(500).springify()}
            className="gap-3 mt-8"
          >
            <ThemedButton label="Let's go 🌴" variant="secondary" onPress={handleSignUp} />
            <ThemedButton label="Sign in" variant="ghost" onPress={handleSignIn} />
          </Animated.View>

        </View>
      </SafeAreaView>
    </ThemedView>
  );
};
