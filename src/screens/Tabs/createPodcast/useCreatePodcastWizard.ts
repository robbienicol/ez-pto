import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useCreateAudio } from '@src/api/hooks/useCreateAudio';

import type { AudioFormat, ContentTone, LiveRadioStyle, Phase, PodcastLength, WizardStep } from './types';
import { FORMAT_OPTIONS, LENGTH_OPTIONS, TONE_OPTIONS } from './wizardConstants';
import { buildAudioGenerateConfirmBody, liveRadioStyleLabel } from './wizardUtils';

export function useCreatePodcastWizard() {
  const { createAudio, isPending, error, createdAudio, reset } = useCreateAudio();

  const [step, setStep] = useState<WizardStep>(1);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<ContentTone>('conversational');
  const [length, setLength] = useState<PodcastLength>(15);
  const [format, setFormat] = useState<AudioFormat>('podcast');
  const [radioStyle, setRadioStyle] = useState<LiveRadioStyle>('sports');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const phase = useMemo<Phase>(() => {
    if (!hasSubmitted) return 'wizard';
    if (isPending) return 'generating';
    if (createdAudio) return 'success';
    return 'error';
  }, [hasSubmitted, isPending, createdAudio]);

  const totalSteps = useMemo(() => (format === 'radio' ? 3 : 4), [format]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as WizardStep);
  }, [step]);

  const handleReset = useCallback(() => {
    setStep(1);
    setTopic('');
    setTone('conversational');
    setLength(15);
    setFormat('podcast');
    setRadioStyle('sports');
    setHasSubmitted(false);
    reset();
  }, [reset]);

  const handleRetry = useCallback(() => {
    setHasSubmitted(false);
    reset();
  }, [reset]);

  const handlePickQuickTopic = useCallback((t: string) => {
    setTopic(t);
    setStep(2);
  }, []);

  const handleContinueFromTopic = useCallback(() => {
    setStep(2);
  }, []);

  const handlePickFormat = useCallback((f: AudioFormat) => {
    setFormat(f);
    setStep(3);
  }, []);

  const handlePickTone = useCallback((t: ContentTone) => {
    setTone(t);
    setStep(4);
  }, []);

  const handlePickLength = useCallback(
    (l: PodcastLength) => {
      setLength(l);
      const trimmed = topic.trim();
      const formatLabel = FORMAT_OPTIONS.find((o) => o.id === format)?.label ?? format;
      const toneLabel = TONE_OPTIONS.find((o) => o.value === tone)?.label ?? tone;
      const lengthLabel = LENGTH_OPTIONS.find((o) => o.value === l)?.label ?? `${l} min`;
      Alert.alert(
        'Generate audio?',
        buildAudioGenerateConfirmBody({
          topic: trimmed,
          formatLabel,
          toneLabel,
          lengthLabel,
        }),
        [
          { text: 'Not yet', style: 'cancel' },
          {
            text: 'Generate',
            onPress: () => {
              setHasSubmitted(true);
              createAudio({
                topic: trimmed,
                format,
                tones: [tone],
                lengthMinutes: l,
              });
            },
          },
        ],
      );
    },
    [topic, format, tone, createAudio],
  );

  const handlePickRadioStyle = useCallback(
    (s: LiveRadioStyle) => {
      setRadioStyle(s);
      const trimmed = topic.trim();
      const formatLabel = FORMAT_OPTIONS.find((o) => o.id === 'radio')?.label ?? 'Live Radio';
      Alert.alert(
        'Generate live radio?',
        buildAudioGenerateConfirmBody({
          topic: trimmed,
          formatLabel,
          radioStyleLabel: liveRadioStyleLabel(s),
        }),
        [
          { text: 'Not yet', style: 'cancel' },
          {
            text: 'Generate',
            onPress: () => {
              setHasSubmitted(true);
              createAudio({
                topic: trimmed,
                format: 'radio',
                radioStyle: s,
              });
            },
          },
        ],
      );
    },
    [topic, createAudio],
  );

  return {
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
  };
}
