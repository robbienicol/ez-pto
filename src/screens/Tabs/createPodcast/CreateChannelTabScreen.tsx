import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { ThemedView } from '@src/components/atoms/ThemedView';
import { MINI_PLAYER_OVERLAP_PADDING } from '@src/components/molecules/MiniPlayer';
import { useTheme } from '@src/state/theme/ThemeProvider';

import { CreatePodcastErrorView } from './CreatePodcastErrorView';
import { CreatePodcastGeneratingView } from './CreatePodcastGeneratingView';
import { CreatePodcastStep1Topic } from './CreatePodcastStep1Topic';
import { CreatePodcastStep2Format } from './CreatePodcastStep2Format';
import { CreatePodcastStep3LiveRadio } from './CreatePodcastStep3LiveRadio';
import { CreatePodcastStep3Tone } from './CreatePodcastStep3Tone';
import { CreatePodcastStep4Length } from './CreatePodcastStep4Length';
import { CreatePodcastSuccessView } from './CreatePodcastSuccessView';
import { StepDots } from './StepDots';
import { useCreatePodcastWizard } from './useCreatePodcastWizard';

export const CreateChannelTabScreen: React.FC = () => {
  const { tokens } = useTheme();
  const {
    phase,
    totalSteps,
    step,
    topic,
    tone,
    length,
    format,
    radioStyle,
    error,
    handleBack,
    handleReset,
    handleRetry,
    handlePickQuickTopic,
    handleContinueFromTopic,
    handlePickFormat,
    handlePickTone,
    handlePickLength,
    handlePickRadioStyle,
    setTopic,
  } = useCreatePodcastWizard();

  if (phase === 'generating') {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <CreatePodcastGeneratingView
            topic={topic}
            format={format}
            lengthMinutes={format === 'radio' ? null : length}
            tone={format === 'radio' ? null : tone}
            radioStyle={format === 'radio' ? radioStyle : null}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'success') {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <CreatePodcastSuccessView
            topic={topic}
            lengthMinutes={format === 'radio' ? null : length}
            format={format}
            tone={format === 'radio' ? null : tone}
            radioStyle={format === 'radio' ? radioStyle : null}
            onCreateAnother={handleReset}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (phase === 'error') {
    return (
      <ThemedView className="flex-1">
        <SafeAreaView className="flex-1">
          <CreatePodcastErrorView message={error} onRetry={handleRetry} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="px-6 pt-6 pb-4 gap-4">
            <View className="flex-row items-center gap-3">
              {step > 1 && (
                <Pressable onPress={handleBack} accessibilityRole="button">
                  <Ionicons name="arrow-back" size={24} color={tokens.colors.foreground} />
                </Pressable>
              )}
              <ThemedText variant="title" className="flex-1">
                Create audio
              </ThemedText>
              <ThemedText variant="caption" tone="muted">
                {step} of {totalSteps}
              </ThemedText>
            </View>
            <StepDots current={step} total={totalSteps} />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 24 + MINI_PLAYER_OVERLAP_PADDING,
            }}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
            <Animated.View key={`${step}-${format}`} entering={FadeInRight.duration(280)}>
              {step === 1 && (
                <CreatePodcastStep1Topic
                  topic={topic}
                  onChangeTopic={setTopic}
                  onPickQuickTopic={handlePickQuickTopic}
                  onContinue={handleContinueFromTopic}
                />
              )}
              {step === 2 && (
                <CreatePodcastStep2Format format={format} onPickFormat={handlePickFormat} />
              )}
              {step === 3 && format === 'radio' && (
                <CreatePodcastStep3LiveRadio
                  radioStyle={radioStyle}
                  onSelect={handlePickRadioStyle}
                />
              )}
              {step === 3 && format !== 'radio' && (
                <CreatePodcastStep3Tone tone={tone} onPickTone={handlePickTone} />
              )}
              {step === 4 && format !== 'radio' && (
                <CreatePodcastStep4Length
                  topic={topic}
                  format={format}
                  tone={tone}
                  length={length}
                  onPickLength={handlePickLength}
                />
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
};
