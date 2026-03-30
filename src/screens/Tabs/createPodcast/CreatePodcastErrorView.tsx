import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { MINI_PLAYER_OVERLAP_PADDING } from '@src/components/molecules/MiniPlayer';
import { useTheme } from '@src/state/theme/ThemeProvider';

interface CreatePodcastErrorViewProps {
  message: string | null;
  onRetry: () => void;
}

export const CreatePodcastErrorView: React.FC<CreatePodcastErrorViewProps> = ({
  message,
  onRetry,
}) => {
  const { tokens } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-1 items-center justify-center gap-6 px-8"
      style={{ paddingBottom: MINI_PLAYER_OVERLAP_PADDING + 24 }}
    >
      <View className="w-20 h-20 rounded-full bg-danger/10 dark:bg-dangerDark/10 items-center justify-center">
        <Ionicons name="alert-circle" size={48} color="#DC2626" />
      </View>

      <View className="gap-2 items-center">
        <ThemedText variant="title" className="text-center">
          Something went wrong
        </ThemedText>
        {message && (
          <ThemedText variant="caption" tone="muted" className="text-center">
            {message}
          </ThemedText>
        )}
      </View>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 9999,
          backgroundColor: tokens.colors.primary,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: 'Nunito_600SemiBold',
            fontSize: 18,
            lineHeight: 24,
            color: '#FFFFFF',
          }}
        >
          Try Again
        </Text>
      </Pressable>
    </Animated.View>
  );
};
