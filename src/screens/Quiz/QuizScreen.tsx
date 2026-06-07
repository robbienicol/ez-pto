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
import { useArtistPreferences } from '@src/state/artistPreferences/ArtistPreferencesProvider';
import { useFocusEffect } from '@react-navigation/native';
import { useAnalytics } from '@src/analytics';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

interface GenreData {
  correctedName: string;
  genres: string[];
}

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

// ─── Static question options ──────────────────────────────────────────────────

const ARTIST_ASPECT_OPTIONS: Option[] = [
  { label: 'the genre', sublabel: 'sounds like nothing else', emoji: '🎶', value: 'aspect:genre' },
  { label: 'the tempo', sublabel: 'it just hits at the right speed', emoji: '⚡', value: 'aspect:tempo' },
  { label: "its what the cool kids are listening to", sublabel: 'i have taste, obviously', emoji: '😎', value: 'aspect:cool' },
  { label: "why are you asking so many questions? am i under arrest?", sublabel: '', emoji: '🚔', value: 'aspect:arrested' },
];

function buildQuestions(favoriteArtists: string[], skipArtists: string[], genreOptions: Option[]): Question[] {
  const laneOptions: Option[] = favoriteArtists.map(name => ({
    label: name,
    emoji: '🎵',
    value: `custom:${name}`,
  }));

  const skipOptions: Option[] = skipArtists.map(name => ({
    label: name,
    emoji: '⏭️',
    value: `custom:${name}`,
  }));

  return [
    {
      id: 'current_vibe',
      prompt: 'Pick a drink.',
      options: [
        { label: 'Whatever the cool kids drink', sublabel: "I'm at a party, ive got the aux, let's dance", emoji: '🫧', value: 'ready_to_disco' },
        { label: 'Just water', sublabel: 'just on autopilot idrc', emoji: '💧', value: 'on_autopilot' },
        { label: 'Hot tea', sublabel: 'winding down, slow it down', emoji: '🍵', value: 'winding_down' },
        { label: 'Road soda', sublabel: "I'm in the car, windows optional", emoji: '🚗', value: 'road_soda' },
      ],
    },
    {
      id: 'artist_lane',
      prompt: 'Hmm. Interesting choice. which artist are you feeling rn?',
      subtitle: 'go with your gut',
      options: laneOptions,
    },
    {
      id: 'artist_aspect',
      prompt: 'LOL same. what about your artist is matching ur vibe?',
      options: ARTIST_ASPECT_OPTIONS,
    },
    {
      id: 'artist_why',
      prompt: "Someone asks what you're listening to. You:",
      options: [
        { label: 'Show them immediately', sublabel: 'no hesitation, good taste is meant to be shared', emoji: '📲', value: 'show_them' },
        { label: 'Hard to explain tbh', sublabel: "you'd have to really know me", emoji: '🤔', value: 'hard_to_explain' },
        { label: "I already made them a playlist", sublabel: 'been waiting for someone to ask', emoji: '🎁', value: 'made_them_playlist' },
        { label: "I'm a gatekeeper ngl", sublabel: 'the real playlist stays private', emoji: '🫣', value: 'would_lie' },
      ],
    },
    {
      id: 'genre_vibe',
      prompt: 'Well thats considerate. Which of these sounds most like your vibe right now?',
      options: genreOptions,
    },
    {
      id: 'era',
      prompt: 'What best describes your music personality?',
      options: [
        { label: 'Timeless', sublabel: 'an old soul', emoji: '🎸', value: 'classic' },
        { label: 'Pop music enjoyer', sublabel: 'we loved this in middle school', emoji: '📼', value: 'throwback' },
        { label: 'Whats popping currently', sublabel: 'my artists sell out stadiums', emoji: '📱', value: 'recent' },
        { label: 'next up', sublabel: 'im scouring the depths of spotify looking for new artists', emoji: '🔥', value: 'discovery' },
        { label: 'Idc man i just want a playlist', sublabel: 'nice try fbi trying to steal my info', emoji: '🎲', value: 'surprise' },
      ],
    },
    {
      id: 'listening_scenario',
      prompt: 'Lol honestly same. btw What sounds better right now?',
      options: [
        { label: 'Play the hits', sublabel: 'songs I know every word to', emoji: '🎤', value: 'singalong' },
        { label: 'Mix it up', sublabel: 'some familiar, some Ive never heard', emoji: '🎵', value: 'popular' },
        { label: 'Surprise me', sublabel: 'deep cuts and hidden gems only', emoji: '💎', value: 'deep_cuts' },
      ],
    },
    {
      id: 'vocals',
      prompt: 'R U feeling Vocals or no vocals?',
      options: [
        { label: 'Give me lyrics', sublabel: 'words matter right now', emoji: '🎤', value: 'vocals' },
        { label: 'Instrumental only', sublabel: 'no words, just sound', emoji: '🎹', value: 'instrumental' },
        { label: 'Either works', sublabel: "I'm not fussed", emoji: '🎵', value: 'either' },
      ],
    },
  ];
}

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
  writeInLabel?: string;
}

function CustomAnswerInput({ onSubmit, isLocked, writeInLabel = '✏️  Something else...' }: CustomAnswerInputProps) {
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
          <ThemedText variant="headline" tone="muted">{writeInLabel}</ThemedText>
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
  writeInLabel?: string;
  onSelect: (value: string) => void;
}

function QuestionContent({ question, direction, pendingSelection, resolvedPrompt, resolvedSubtitle, writeInLabel, onSelect }: QuestionContentProps) {
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
          writeInLabel={writeInLabel}
        />
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

async function fetchArtistGenres(artistName: string): Promise<GenreData> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Artist name (may be misspelled): "${artistName}"\n\nFix any spelling mistakes and return 4 genre tags for this artist.\nReturn JSON: { "correctedName": "Exact Artist Name", "genres": ["genre1", "genre2", "genre3", "genre4"] }\nGenres must be short lowercase labels like "indie rock", "hip-hop", "dream pop", "r&b". Max 3 words each.`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 80,
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as Partial<GenreData>;
  if (!parsed.correctedName || !Array.isArray(parsed.genres) || parsed.genres.length === 0) {
    throw new Error('invalid genre response');
  }
  return { correctedName: parsed.correctedName, genres: parsed.genres.slice(0, 4) };
}

export const QuizScreen: React.FC<Props> = ({ navigation }) => {
  const { tokens } = useTheme();
  const { favoriteArtists, skipArtists, isLoaded, addFavorite, addSkip, removeFavorite } = useArtistPreferences();
  const analytics = useAnalytics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [genreData, setGenreData] = useState<GenreData | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const genreOptions = useMemo<Option[]>(
    () => (genreData?.genres ?? []).map(g => ({
      label: g,
      emoji: '🎵',
      value: `genre:${g}`,
    })),
    [genreData],
  );

  const questions = useMemo(
    () => (isLoaded ? buildQuestions(favoriteArtists, skipArtists, genreOptions) : []),
    [isLoaded, favoriteArtists, skipArtists, genreOptions],
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

  // Auto-skip genre question if genres didn't arrive in time
  const isAtEmptyGenreQuestion = question?.id === 'genre_vibe' && question.options.length === 0 && pendingSelection === null;
  useEffect(() => {
    if (!isAtEmptyGenreQuestion) return;
    setSlideDirection(1);
    setCurrentIndex(i => i + 1);
  }, [isAtEmptyGenreQuestion]);

  const handleSelect = useCallback(
    (value: string) => {
      if (!question || pendingSelection) return;

      // Persist new artists and trigger background genre fetch
      if (question.id === 'artist_lane' && value.startsWith('custom:')) {
        const rawName = value.slice(7);
        addFavorite(rawName);
        setGenreData(null);
        fetchArtistGenres(rawName).then(result => {
          setGenreData(result);
          // Patch answers with corrected spelling
          setAnswers(prev => ({ ...prev, artist_lane: `custom:${result.correctedName}` }));
          // Update stored preference if name was corrected
          if (result.correctedName.toLowerCase() !== rawName.toLowerCase()) {
            removeFavorite(rawName);
            addFavorite(result.correctedName);
          }
        }).catch(() => { /* fail silently — genre question auto-skips */ });
      }
      if (question.id === 'skip_artist' && value.startsWith('custom:')) {
        addSkip(value.slice(7));
      }

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
    [analytics, answers, currentIndex, navigation, pendingSelection, question, questions, addFavorite, addSkip, removeFavorite],
  );

  const handleBack = useCallback(() => {
    if (pendingSelection) return;
    if (currentIndex > 0) {
      setSlideDirection(-1);
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex, pendingSelection]);

  const chosenArtistName = useMemo(() => {
    if (!answers.artist_lane?.startsWith('custom:')) return null;
    return answers.artist_lane.slice(7);
  }, [answers.artist_lane]);

  const resolvedPrompt = useMemo(() => {
    if (question?.id === 'vocals' && answers.skip_artist === 'none') {
      return 'LOL fair enough. Vocals or no vocals?';
    }
    if (question?.id === 'artist_aspect' && chosenArtistName) {
      return `LOL same. what about ${chosenArtistName} is matching ur vibe?`;
    }
    return question?.prompt ?? '';
  }, [question, answers.skip_artist, chosenArtistName]);

  const resolvedSubtitle = useMemo(() => {
    if (question?.id === 'artist_why') return chosenArtistName;
    return question?.subtitle ?? null;
  }, [question, chosenArtistName]);

  if (!isLoaded || !question) {
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
          style={{ flex: 1 }}
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
                  writeInLabel={question.id === 'artist_lane' ? '✏️  Type an artist...' : undefined}
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
