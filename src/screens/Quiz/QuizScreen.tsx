import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text as RNText, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ThemedText } from '@src/components/atoms/ThemedText';
import { StarryScreen } from '@src/components/atoms/StarryScreen';
import { cn } from '@src/utils/cn';
import { useTheme } from '@src/state/theme/ThemeProvider';
import { useSpotifyTopData } from '@src/api/hooks/useSpotifyTopData';
import type { SpotifyArtist } from '@src/api/hooks/useSpotifyTopData';
import { useFocusEffect } from '@react-navigation/native';
import { useAnalytics } from '@src/analytics';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Quiz'>;

interface Option {
  label: string;
  sublabel?: string;
  emoji: string;
  value: string;
}

interface Question {
  id: string;
  prompt: string;
  subtitle?: string;
  options: Option[];
}

// ─── Genre bucketing ─────────────────────────────────────────────────────────

const BUCKETS: { key: string; label: string; keywords: string[] }[] = [
  { key: 'rap', label: 'rap / hip-hop', keywords: ['hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'grime'] },
  { key: 'rb', label: 'r&b / soul', keywords: ['r&b', 'soul', 'neo soul', 'alternative r&b', 'indie r&b'] },
  { key: 'rock', label: 'rock / punk', keywords: ['rock', 'punk', 'metal', 'alternative', 'grunge', 'hardcore', 'post-punk', 'indie rock', 'emo'] },
  { key: 'country', label: 'country / folk', keywords: ['country', 'folk', 'americana', 'singer-songwriter', 'acoustic'] },
  { key: 'electronic', label: 'electronic / dance', keywords: ['electronic', 'dance', 'house', 'techno', 'edm', 'dubstep', 'synth'] },
  { key: 'pop', label: 'pop', keywords: ['pop', 'teen pop', 'dance pop'] },
  { key: 'indie', label: 'indie / chill', keywords: ['indie', 'indie pop', 'lo-fi', 'dream pop', 'chillwave'] },
  { key: 'latin', label: 'latin', keywords: ['latin', 'reggaeton', 'salsa'] },
];

function assignBucket(artist: SpotifyArtist): string | null {
  for (const bucket of BUCKETS) {
    if (artist.genres.some(g => bucket.keywords.some(kw => g.toLowerCase().includes(kw)))) {
      return bucket.key;
    }
  }
  return null;
}

function pickDiverseArtists(artists: SpotifyArtist[], count: number, excludeIds?: Set<string>): Array<SpotifyArtist & { lane: string }> {
  const bucketCounts = new Map<string, number>();
  const picked: Array<SpotifyArtist & { lane: string }> = [];
  const pickedIds = new Set<string>();
  const pool = excludeIds ? artists.filter(a => !excludeIds.has(a.id)) : artists;

  const tryAdd = (artist: SpotifyArtist, maxPerBucket: number) => {
    if (picked.length >= count || pickedIds.has(artist.id)) return;
    const bucket = assignBucket(artist) ?? '_unknown';
    if ((bucketCounts.get(bucket) ?? 0) < maxPerBucket) {
      bucketCounts.set(bucket, (bucketCounts.get(bucket) ?? 0) + 1);
      const lane = BUCKETS.find(b => b.key === bucket)?.label ?? '';
      picked.push({ ...artist, lane });
      pickedIds.add(artist.id);
    }
  };

  for (const artist of pool) tryAdd(artist, 1);   // first pass: max 1 per genre bucket
  for (const artist of pool) tryAdd(artist, 2);   // second pass: allow 2 per bucket
  for (const artist of pool) tryAdd(artist, 999); // final: fill remainder

  return picked;
}

function buildQuestions(artists: SpotifyArtist[]): Question[] {
  const laneOptions = pickDiverseArtists(artists, 8);
  const laneIds = new Set(laneOptions.map(a => a.id));
  const skipOptions = pickDiverseArtists(artists, 5, laneIds);

  return [
    {
      id: 'current_vibe',
      prompt: "Pick a drink.",
      options: [
        { label: 'Whatever the cool kids drink', sublabel: "I'm at a party, let's dance", emoji: '🫧', value: 'ready_to_disco' },
        { label: 'Just water', sublabel: 'just on autopilot idrc', emoji: '💧', value: 'on_autopilot' },
        { label: 'Hot tea', sublabel: 'winding down, slow it down', emoji: '🍵', value: 'winding_down' },
        { label: 'Sparkling water at 2am', sublabel: 'brain is alive, creative', emoji: '✨', value: 'feeling_creative' },
      ],
    },
    {
      id: 'artist_lane',
      prompt: "Hmm. Interesting choice. which artist are you feeling rn?",
      subtitle: 'go with your gut',
      options: laneOptions.map(a => ({
        label: a.name,
        sublabel: a.lane,
        emoji: '🎵',
        value: a.id,
      })),
    },
    {
      id: 'artist_why',
      prompt: `Honestly vibes. What's making you gravitate there?`,
      options: [
        { label: "I'm just obsessed right now", sublabel: 'no further explanation needed', emoji: '🔥', value: 'obsessed' },
        { label: "The genre is fitting", sublabel: 'that whole sound feels right', emoji: '🎵', value: 'genre' },
        { label: 'It just is', sublabel: "can't explain it", emoji: '🤷', value: 'vibes' },
        { label: 'everyone is talking about it', sublabel: 'trending on socials', emoji: '🎤', value: 'lyrics' },
      ],
    },
    {
      id: 'era',
      prompt: "What era would you go to if you could go back in time?",
      options: [
        { label: 'Timeless', sublabel: 'pre-90s, classic, vintage', emoji: '🎸', value: 'classic' },
        { label: 'Throwback', sublabel: '90s and 2000s', emoji: '📼', value: 'throwback' },
        { label: 'Recent', sublabel: '2010s', emoji: '📱', value: 'recent' },
        { label: 'Right now', sublabel: 'current and fresh', emoji: '🔥', value: 'now' },
        { label: 'Idc, pick for me', sublabel: 'whatever feels right', emoji: '🎲', value: 'surprise' },
      ],
    },
    {
      id: 'listening_scenario',
      prompt: "Lol honestly same. btw What sounds better right now?",
      options: [
        { label: 'Play the hits', sublabel: 'songs I know every word to', emoji: '🎤', value: 'singalong' },
        { label: 'Mix it up', sublabel: 'some familiar, some Ive never heard', emoji: '🎵', value: 'popular' },
        { label: 'Surprise me', sublabel: 'deep cuts and hidden gems only', emoji: '💎', value: 'deep_cuts' },
      ],
    },
    {
      id: 'skip_artist',
      prompt: "K cool. Who would you most likely skip right now?",
      subtitle: 'even if you love them normally',
      options: [
        ...skipOptions.map(a => ({ label: a.name, sublabel: a.lane, emoji: '⏭️', value: a.id })),
        { label: 'Lolll no way I love them', sublabel: "Nice try but I would never skip them", emoji: '🎵', value: 'none' },

      ].slice(0, 6),
    },
    {
      id: 'vocals',
      prompt: 'Get outta here you love them! R U feeling Vocals or no vocals?',
      options: [
        { label: 'Give me lyrics', sublabel: 'words matter right now', emoji: '🎤', value: 'vocals' },
        { label: 'Instrumental only', sublabel: 'no words, just sound', emoji: '🎹', value: 'instrumental' },
        { label: 'Either works', sublabel: "I'm not fussed", emoji: '🎵', value: 'either' },
      ],
    },

  ].filter(q => q.options.length > 0);
}

// ─── Analysis log ─────────────────────────────────────────────────────────────


// ─── Disco progress bar ───────────────────────────────────────────────────────

const DISCO_COLORS = ['#FF4DB3', '#BF5FFF', '#00B8FF', '#FFD700', '#00E676'];

const SELECTION_ACCENTS = [
  'bg-neonPink/45 border-neonPink',
  'bg-neonPurple/45 border-neonPurple',
  'bg-electricBlue/45 border-electricBlue',
  'bg-laserGreen/45 border-laserGreen',
  'bg-gold/45 border-gold',
] as const;

const ADVANCE_AFTER_SELECT_MS = 0;

interface OptionPressableProps {
  option: Option;
  optionIndex: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: (value: string) => void;
}

function DiscoSegment({ color, filled }: { color: string; filled: boolean }) {
  const scaleY = useSharedValue(filled ? 1 : 0.5);
  const opacity = useSharedValue(filled ? 1 : 0.18);

  useEffect(() => {
    scaleY.value = withSpring(filled ? 1 : 0.5, { damping: 10, stiffness: 200 });
    opacity.value = withTiming(filled ? 1 : 0.18, { duration: 200 });
  }, [filled, opacity, scaleY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ backgroundColor: color, borderRadius: 99, flex: 1, height: 10 }, animStyle]}
    />
  );
}

function DiscoProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <DiscoSegment
          key={i}
          color={DISCO_COLORS[i % DISCO_COLORS.length]}
          filled={i < current}
        />
      ))}
    </View>
  );
}

// ─── Option components ────────────────────────────────────────────────────────

function QuizOption({ option, optionIndex, isSelected, isLocked, onPress }: OptionPressableProps) {
  const accentClass = SELECTION_ACCENTS[optionIndex % SELECTION_ACCENTS.length];

  const handlePress = useCallback(() => {
    if (isLocked) return;
    onPress(option.value);
  }, [isLocked, onPress, option.value]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLocked}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isLocked }}
      className={cn(
        'flex-row items-center gap-4 px-4 py-4 rounded-2xl border-2',
        isSelected
          ? accentClass
          : 'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark',
        isLocked && !isSelected && 'opacity-35',
        !isLocked && !isSelected && 'active:opacity-70',
      )}
    >
      <View className="flex-1">
        <ThemedText
          variant="headline"
          className={cn(isSelected && 'text-white font-nunito-extrabold')}
        >
          {option.label}
        </ThemedText>
        {option.sublabel ? (
          <ThemedText
            variant="caption"
            tone={isSelected ? 'default' : 'muted'}
            className={cn(isSelected && 'text-white/90')}
          >
            {option.sublabel}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Custom answer input ──────────────────────────────────────────────────────

interface CustomAnswerInputProps {
  onSubmit: (value: string) => void;
  isLocked: boolean;
}

function CustomAnswerInput({ onSubmit, isLocked }: CustomAnswerInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');

  const handleConfirm = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(`custom:${trimmed}`);
  }, [text, onSubmit]);

  if (!isExpanded) {
    return (
      <Pressable
        onPress={() => setIsExpanded(true)}
        disabled={isLocked}
        accessibilityRole="button"
        className={cn(
          'flex-row items-center gap-4 px-4 py-4 rounded-2xl border-2',
          'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark',
          isLocked ? 'opacity-35' : 'active:opacity-70',
        )}
      >
        <View className="flex-1">
          <ThemedText variant="headline" tone="muted">✏️  Something else...</ThemedText>
        </View>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        backgroundColor: 'rgba(10, 5, 35, 0.9)',
        borderWidth: 2,
        borderColor: '#FF69B4',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <TextInput
        autoFocus
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleConfirm}
        placeholder="type it out..."
        placeholderTextColor="rgba(255,255,255,0.3)"
        returnKeyType="done"
        style={{
          flex: 1,
          color: '#FFFFFF',
          fontSize: 18,
          fontFamily: 'Nunito_400Regular',
          padding: 0,
        }}
      />
      <Pressable
        onPress={handleConfirm}
        disabled={!text.trim()}
        style={{ opacity: text.trim() ? 1 : 0.3 }}
        accessibilityRole="button"
        accessibilityLabel="Submit answer"
      >
        <RNText style={{ fontSize: 24, color: '#FF69B4' }}>→</RNText>
      </Pressable>
    </View>
  );
}

// ─── Animated question content ────────────────────────────────────────────────

interface QuestionContentProps {
  question: Question;
  direction: 1 | -1;
  pendingSelection: string | null;
  resolvedPrompt: string;
  resolvedSubtitle: string | null;
  onSelect: (value: string) => void;
}

function QuestionContent({ question, direction, pendingSelection, resolvedPrompt, resolvedSubtitle, onSelect }: QuestionContentProps) {
  const { width: SCREEN_W } = useWindowDimensions();
  const slideX = useSharedValue(direction * SCREEN_W);

  useEffect(() => {
    slideX.value = withTiming(0, { duration: 260, easing: Easing.steps(8, true) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));

  return (
    <Animated.View style={animStyle} className="gap-6">
      <View className="gap-1.5">
        <ThemedText variant="title">{resolvedPrompt}</ThemedText>
        {resolvedSubtitle ? (
          <ThemedText variant="body" tone="muted" className="font-vt323">
            {resolvedSubtitle}
          </ThemedText>
        ) : null}
      </View>

      <View className="gap-3">
        {question.options.map((opt, optionIndex) => (
          <QuizOption
            key={opt.value}
            option={opt}
            optionIndex={optionIndex}
            isSelected={pendingSelection === opt.value}
            isLocked={pendingSelection !== null && pendingSelection !== opt.value}
            onPress={onSelect}
          />
        ))}
        <CustomAnswerInput
          key={question.id}
          onSubmit={onSelect}
          isLocked={pendingSelection !== null}
        />
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const QuizScreen: React.FC<Props> = ({ navigation }) => {
  const { tokens } = useTheme();
  const { data: topData } = useSpotifyTopData();
  const analytics = useAnalytics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = useMemo(
    () => (topData ? buildQuestions(topData.artists) : []),
    [topData],
  );

  const question = questions[currentIndex];

  useFocusEffect(
    useCallback(() => {
      analytics.quizStarted();
    }, [analytics]),
  );

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      if (!question || pendingSelection) return;

      const nextAnswers = { ...answers, [question.id]: value };
      setAnswers(nextAnswers);
      setPendingSelection(value);

      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = setTimeout(() => {
        advanceTimeoutRef.current = null;
        setPendingSelection(null);

        if (currentIndex < questions.length - 1) {
          setSlideDirection(1);
          setCurrentIndex(i => i + 1);
          return;
        }

        analytics.quizCompleted(nextAnswers);
        navigation.navigate('Results', { answers: nextAnswers });
      }, ADVANCE_AFTER_SELECT_MS);
    },
    [analytics, answers, currentIndex, navigation, pendingSelection, question, questions],
  );

  const handleBack = useCallback(() => {
    if (pendingSelection) return;
    if (currentIndex > 0) {
      setSlideDirection(-1);
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex, pendingSelection]);

  const chosenArtistName = useMemo(() => {
    if (!answers.artist_lane) return null;
    if (answers.artist_lane.startsWith('custom:')) return answers.artist_lane.slice(7);
    return topData?.artists.find(a => a.id === answers.artist_lane)?.name ?? null;
  }, [answers.artist_lane, topData]);

  const resolvedSubtitle = useMemo(() => {
    if (question?.id === 'artist_why') return chosenArtistName;
    return question?.subtitle ?? null;
  }, [question, chosenArtistName]);

  const resolvedPrompt = useMemo(() => {
    if (question?.id === 'vocals' && answers.skip_artist === 'none') {
      return 'LOL fair enough. Vocals or no vocals?';
    }
    return question?.prompt ?? '';
  }, [question, answers.skip_artist]);

  if (!question) {
    return (
      <StarryScreen className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </SafeAreaView>
      </StarryScreen>
    );
  }

  return (
    <StarryScreen className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1, }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 pt-6 pb-10 gap-6">

              {/* Header */}
              <View className="flex-row items-center gap-3">
                {currentIndex > 0 ? (
                  <Pressable onPress={handleBack} accessibilityRole="button">
                    <RNText style={{ fontSize: 24, color: tokens.colors.foreground }}>←</RNText>
                  </Pressable>
                ) : (
                  <View style={{ width: 24 }} />
                )}
                <DiscoProgressBar current={currentIndex} total={questions.length} />
                <ThemedText variant="caption" tone="muted" style={{ minWidth: 36, textAlign: 'right' }}>
                  {currentIndex + 1}/{questions.length}
                </ThemedText>
              </View>

              <View style={{ overflow: 'hidden' }}>
                <QuestionContent
                  key={question.id}
                  question={question}
                  direction={slideDirection}
                  pendingSelection={pendingSelection}
                  resolvedPrompt={resolvedPrompt}
                  resolvedSubtitle={resolvedSubtitle}
                  onSelect={handleSelect}
                />
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </StarryScreen>
  );
};
