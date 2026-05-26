import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, Image, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { PixelLetsGoButton } from '@src/components/atoms/PixelLetsGoButton';
import { StarryScreen } from '@src/components/atoms/StarryScreen';
import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { useSpotifyTopData } from '@src/api/hooks/useSpotifyTopData';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

function FloatingEmoji({ emoji, delay, startY }: { emoji: string; delay: number; startY: number }) {
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

function FeatureChip({ emoji, label, color, index }: { emoji: string; label: string; color: string; index: number }) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(700 + index * 120, withSpring(1, { damping: 12 }));
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style} className={`flex-row items-center gap-2 px-4 py-2.5 rounded-pill ${color} border`}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <ThemedText variant="caption" className="font-nunito-extrabold">{label}</ThemedText>
    </Animated.View>
  );
}

const VALUE_PROPS = [
  { emoji: '⚡', label: '10 questions', color: 'bg-gold/15 border-gold/30' },
  { emoji: '🔓', label: 'No sign-up', color: 'bg-laserGreen/15 border-laserGreen/30' },
  { emoji: '🆓', label: 'Always free', color: 'bg-neonPurple/15 border-neonPurple/30' },
  { emoji: '🎵', label: 'Your Spotify', color: 'bg-electricBlue/15 border-electricBlue/30' },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { isConnected, isLoading: authLoading, connect, disconnect } = useSpotifyAuth();
  const { data: topData, isLoading: dataLoading, status: dataStatus } = useSpotifyTopData();

  const isDataError = dataStatus === 'error';
  const isReady = isConnected && !!topData;

  const handlePress = useCallback(() => {
    if (!isConnected) {
      connect();
      return;
    }
    if (isReady) {
      navigation.navigate('Quiz');
    }
  }, [isConnected, isReady, connect, navigation]);

  const handleReconnect = useCallback(async () => {
    await disconnect();
    connect();
  }, [disconnect, connect]);

  const buttonLabel = () => {
    if (!isConnected) return 'Connect Spotify 🎧';
    if (dataLoading) return 'Loading your music...';
    if (isDataError) return 'Retry connection';
    return "Let's go";
  };

  const showSpinner = isConnected && dataLoading;

  return (
    <StarryScreen>
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 justify-between">

          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            className="flex-row justify-center gap-8 pt-4"
          >
            <FloatingEmoji emoji="🕺" delay={0} startY={0} />
            <FloatingEmoji emoji="🪩" delay={300} startY={-6} />
            <FloatingEmoji emoji="🎧" delay={180} startY={2} />
            <FloatingEmoji emoji="🎵" delay={450} startY={-4} />
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
                      fontFamily: 'Righteous_400Regular',
                      fontSize: 22,
                      lineHeight: 32,
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    {'Answer '}
                    <Text style={{ color: '#FFD700' }}>10 questions</Text>
                    {'.\nGet your perfect playlist.'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInUp.delay(500).duration(400)}
            className="flex-row flex-wrap justify-center gap-3 mt-6"
          >
            {VALUE_PROPS.map((v, i) => (
              <FeatureChip key={v.label} {...v} index={i} />
            ))}
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(900).duration(500).springify()}
            className="gap-3 mt-8"
          >
            {isDataError && (
              <ThemedText variant="caption" tone="muted" className="text-center">
                Couldn&apos;t load your Spotify data. Tap below to reconnect.
              </ThemedText>
            )}

            <View className="relative">
              <ThemedButton
                label={buttonLabel()}
                variant="primary"
                showSelectionCursor={isReady && !showSpinner}
                onPress={isDataError ? handleReconnect : handlePress}
                disabled={showSpinner}
              />
              {showSpinner && (
                <View className="absolute right-4 top-0 bottom-0 justify-center">
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>

            {isConnected && (
              <ThemedButton
                label="Disconnect Spotify"
                variant="ghost"
                onPress={disconnect}
              />
            )}
          </Animated.View>

        </View>
      </SafeAreaView>
    </StarryScreen>
  );
};
