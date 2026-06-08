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
  { label: 'the genre', value: 'aspect:genre' },
  { label: 'the tempo', value: 'aspect:tempo' },
  { label: 'it puts me on autopilot', sublabel: '', value: 'aspect:inthezone' },
  { label: 'why are you asking so many questions? am i under arrest?', sublabel: '', value: 'aspect:arrested' },
];

function buildQuestions(favoriteArtists: string[], skipArtists: string[], genreOptions: Option[]): Question[] {
  const laneOptions: Option[] = favoriteArtists.map(name => ({
    label: name,
    value: `custom:${name}`,
  }));

  const skipOptions: Option[] = skipArtists.map(name => ({
    label: name,
    value: `custom:${name}`,
  }));

  return [
    {
      id: 'current_vibe',
      prompt: 'pick a drink.',
      options: [
        { label: 'whatever the cool kids drink', sublabel: "i'm at a party, ive got the aux, let's dance", value: 'ready_to_disco' },
        { label: 'just water', sublabel: 'just on autopilot idrc', value: 'on_autopilot' },
        { label: 'hot tea', sublabel: 'winding down, slow it down', value: 'winding_down' },
        { label: 'road soda', sublabel: "i'm in the car, windows optional", value: 'road_soda' },
      ],
    },
    {
      id: 'artist_lane',
      prompt: 'anyways which artist are you feeling rn?',
      options: laneOptions,
    },
    {
      id: 'artist_aspect',
      prompt: 'LOL same. what about your artist is matching ur vibe?',
      options: ARTIST_ASPECT_OPTIONS,
    },
    {
      id: 'genre_vibe',
      prompt: 'which genre are we specifically vibing with?',
      options: genreOptions,
    },
    {
      id: 'artist_why',
      prompt: "if someone tries to shazam a song you're playing, you:",
      options: [
        { label: "tell them the song immediately, i'm not a hater", value: 'show_them' },
        { label: 'i send them the whole playlist', value: 'made_them_playlist' },
        { label: "i'm a gatekeeper ngl, im throwing their phone out the window", value: 'would_lie' },
      ],
    },
 
    {
      id: 'era',
      prompt: 'if you could own ur favorite album in any format, it would be:',
      options: [
        { label: 'give me it on vinyl', value: 'classic' },
        { label: 'im cool with a CD/cassette', value: 'throwback' },
        { label: 'i\'m cool with just having it on my phone',  value: 'recent' },
        { label: 'can i get it implanted into my brain or something?', sublabel: 'im scouring the depths of spotify looking for new artists', value: 'discovery' },
        { label: 'idc man i just want a playlist', sublabel: 'nice try fbi trying to steal my info', value: 'surprise' },
      ],
    },
    {
      id: 'listening_scenario',
      prompt: 'last question. what sounds better right now?',
      options: [
        { label: 'play the hits', sublabel: 'songs i know every word to', value: 'singalong' },
        { label: 'mix it up', sublabel: "some familiar, some i've never heard", value: 'popular' },
        { label: 'surprise me', sublabel: 'deep cuts and hidden gems only', value: 'deep_cuts' },
      ],
    },
    {
      id: 'vocals',
      prompt: 'r u feeling vocals or no vocals?',
      options: [
        { label: 'give me lyrics', sublabel: 'words matter right now', value: 'vocals' },
        { label: 'instrumental only', sublabel: 'no words, just sound', value: 'instrumental' },
        { label: 'either works', sublabel: "i'm not fussed", value: 'either' },
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

// ─── Trait system ────────────────────────────────────────────────────────────

interface Traits {
  coolness: number;
  chaos: number;
  emotionalDamage: number;
  danceability: number;
  gatekeeping: number;
  discovery: number;
}

const TRAIT_LABELS: Record<keyof Traits, string> = {
  coolness: 'coolness',
  chaos: 'chaos',
  emotionalDamage: 'emotional damage',
  danceability: 'danceability',
  gatekeeping: 'gatekeeping',
  discovery: 'discovery',
};

const DEFAULT_TRAITS: Traits = { coolness: 0, chaos: 0, emotionalDamage: 0, danceability: 0, gatekeeping: 0, discovery: 0 };

const ANSWER_TRAITS: Record<string, Partial<Traits>> = {
  ready_to_disco:     { danceability: 25, coolness: 15, chaos: 10 },
  on_autopilot:       { emotionalDamage: 10, chaos: 5 },
  winding_down:       { emotionalDamage: 20, discovery: 5 },
  road_soda:          { chaos: 20, coolness: 15, danceability: 5 },
  'aspect:genre':     { discovery: 15, gatekeeping: 10 },
  'aspect:tempo':     { danceability: 20, coolness: 10 },
  'aspect:inthezone': { coolness: 15, chaos: 10 },
  'aspect:arrested':  { chaos: 30, coolness: 20 },
  show_them:          { coolness: 15, danceability: 10 },
  made_them_playlist: { emotionalDamage: 10, coolness: 10 },
  would_lie:          { gatekeeping: 25, coolness: 10 },
  hard_to_explain:    { emotionalDamage: 15, discovery: 10 },
  classic:            { gatekeeping: 20, discovery: 10 },
  throwback:          { emotionalDamage: 20, danceability: 10 },
  recent:             { danceability: 20, coolness: 10 },
  discovery:          { discovery: 25, gatekeeping: 15 },
  surprise:           { chaos: 25, danceability: 10 },
  singalong:          { danceability: 25, coolness: 10 },
  popular:            { coolness: 15, discovery: 10 },
  deep_cuts:          { discovery: 25, gatekeeping: 20 },
  vocals:             { emotionalDamage: 10, danceability: 15 },
  instrumental:       { discovery: 15, gatekeeping: 10 },
  either:             { coolness: 15, danceability: 5 },
  
};

const NARRATOR_REACTIONS: Record<string, string> = {
  ready_to_disco:     "woohoo! ok lets get funky.",
  on_autopilot:       "sheesh atleast put a lemon in it mr. boring.",
  winding_down:       "snoozer.",
  road_soda:          "excellent. i'll take a mr.pibb if you dont mind.",
  'aspect:arrested':  "LMAO licence & registration please? jkjk.",
  show_them:          "that's actually very kind of you.",
  made_them_playlist: "what a sweetheart you are.",
  would_lie:          "hey we've all been there.",
  classic:            "really? i'll make sure to not pass you the aux any time soon. anyways",
  throwback:          "really? i'll make sure to not pass you the aux any time soon. anyways",
  recent:             "really? i'll make sure to not pass you the aux any time soon. anyways",
  discovery:          "this is the only right answer. anyways",
  surprise:           "LOL okok",
  singalong:          "noted. ok actual last question:",
  popular:            "noted. ok actual last question:",
  deep_cuts:          "noted. ok actual last question:",
  vocals:             "words. feelings. the whole situation.",
  instrumental:       "letting the piano do the crying.",
  either:             "flexible. dangerous.",
};

const CHECKPOINT_AFTER = new Set([2, 5]);

// ─────────────────────────────────────────────────────────────────────────────

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

function CustomAnswerInput({ onSubmit, isLocked, writeInLabel = 'something else...' }: CustomAnswerInputProps) {
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
        {writeInLabel !== undefined && (
          <CustomAnswerInput
            key={question.id}
            onSubmit={onSelect}
            isLocked={pendingSelection !== null}
            writeInLabel={writeInLabel}
          />
        )}
      </View>
    </Animated.View>
  );
}

// ─── Narrator ────────────────────────────────────────────────────────────────

function TraitRow({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, value);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(pct, { duration: 700 });
  }, [pct, barWidth]);

  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` as `${number}%` }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <RNText style={{ width: 140, fontFamily: 'VT323_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </RNText>
      <View style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <Animated.View style={[{ height: 3, backgroundColor: '#FF4DB3', borderRadius: 2 }, barStyle]} />
      </View>
      <RNText style={{ width: 38, textAlign: 'right', fontFamily: 'VT323_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.45)' }}>
        {pct}%
      </RNText>
    </View>
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
  const [traits, setTraits] = useState<Traits>(DEFAULT_TRAITS);
  const [lastReaction, setLastReaction] = useState<string | null>(null);
  const pendingAnswersRef = useRef<Record<string, string>>({});
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const genreOptions = useMemo<Option[]>(
    () => (genreData?.genres ?? []).map(g => ({ label: g, value: `genre:${g}` })),
    [genreData],
  );

  const questions = useMemo(() => {
    if (!isLoaded) return [];
    const all = buildQuestions(favoriteArtists, skipArtists, genreOptions);
    if (answers.artist_aspect && answers.artist_aspect !== 'aspect:genre') {
      return all.filter(q => q.id !== 'genre_vibe');
    }
    return all;
  }, [isLoaded, favoriteArtists, skipArtists, genreOptions, answers.artist_aspect]);

  const question = questions[currentIndex];

  useFocusEffect(
    useCallback(() => {
      analytics.quizStarted();
    }, [analytics]),
  );

  // Auto-skip genre question if genres didn't arrive in time
  const isAtEmptyGenreQuestion = question?.id === 'genre_vibe' && question.options.length === 0 && pendingSelection === null;
  useEffect(() => {
    if (!isAtEmptyGenreQuestion) return;
    setSlideDirection(1);
    setCurrentIndex(i => i + 1);
  }, [isAtEmptyGenreQuestion]);

  useEffect(() => {
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      if (!question || pendingSelection) return;

      if (question.id === 'artist_lane' && value.startsWith('custom:')) {
        const rawName = value.slice(7);
        addFavorite(rawName);
        setGenreData(null);
        fetchArtistGenres(rawName).then(result => {
          setGenreData(result);
          setAnswers(prev => ({ ...prev, artist_lane: `custom:${result.correctedName}` }));
          if (result.correctedName.toLowerCase() !== rawName.toLowerCase()) {
            removeFavorite(rawName);
            addFavorite(result.correctedName);
          }
        }).catch(() => {});
      }
      if (question.id === 'skip_artist' && value.startsWith('custom:')) {
        addSkip(value.slice(7));
      }

      const nextAnswers = { ...answers, [question.id]: value };
      pendingAnswersRef.current = nextAnswers;
      setAnswers(nextAnswers);
      setPendingSelection(value);

      const delta = ANSWER_TRAITS[value];
      const nextTraits: Traits = delta ? {
        coolness:        traits.coolness        + (delta.coolness        ?? 0),
        chaos:           traits.chaos           + (delta.chaos           ?? 0),
        emotionalDamage: traits.emotionalDamage + (delta.emotionalDamage ?? 0),
        danceability:    traits.danceability    + (delta.danceability    ?? 0),
        gatekeeping:     traits.gatekeeping     + (delta.gatekeeping     ?? 0),
        discovery:       traits.discovery       + (delta.discovery       ?? 0),
      } : traits;
      if (delta) setTraits(nextTraits);

      const reactionText = NARRATOR_REACTIONS[value]
        

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        setPendingSelection(null);
        setLastReaction(reactionText);

        if (currentIndex < questions.length - 1) {
          setSlideDirection(1);
          setCurrentIndex(i => i + 1);
        } else {
          analytics.quizCompleted(pendingAnswersRef.current);
          navigation.navigate('Results', { answers: pendingAnswersRef.current });
        }
      }, 250);
    },
    [analytics, answers, currentIndex, navigation, pendingSelection, question, questions.length, traits, addFavorite, addSkip, removeFavorite],
  );

  const handleBack = useCallback(() => {
    if (pendingSelection) return;
    if (currentIndex > 0) {
      setLastReaction(null);
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
      return 'LOL fair enough. vocals or no vocals?';
    }
    if (question?.id === 'artist_aspect' && chosenArtistName) {
      return `LOL same. what about ${chosenArtistName} is matching ur vibe?`;
    }
    if (question?.id === 'artist_why' && answers.artist_aspect === 'aspect:arrested') {
      return "if someone asks what you're listening to. you:";
    }
    return question?.prompt ?? '';
  }, [question, answers.skip_artist, answers.artist_aspect, chosenArtistName]);

  const resolvedSubtitle = useMemo(() => {
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
              </View>

              <View style={{ overflow: 'hidden' }}>
                <QuestionContent
                  key={question.id}
                  question={question}
                  direction={slideDirection}
                  pendingSelection={pendingSelection}
                  resolvedPrompt={lastReaction ? `${lastReaction} ${resolvedPrompt}` : resolvedPrompt}
                  resolvedSubtitle={resolvedSubtitle}
                  writeInLabel={question.id === 'artist_lane' ? 'type an artist...' : undefined}
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
