import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text as RNText, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as StoreReview from 'expo-store-review';
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
import { useAnalytics } from '@src/analytics';
import { QUESTIONS, NARRATOR_REACTIONS } from '@src/config/quiz';
import type { QuizOption } from '@src/config/quiz';
import type { AppStackParamList } from '@src/navigation/AppNavigator';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

type Props = NativeStackScreenProps<AppStackParamList, 'Quiz'>;

interface GenreData {
  correctedName: string;
  genres: string[];
}

// ─── Fetch artist genres from OpenAI ─────────────────────────────────────────

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

// ─── Progress bar ─────────────────────────────────────────────────────────────

const DISCO_COLORS = ['#FF4DB3', '#BF5FFF', '#00B8FF', '#FFD700', '#00E676'];

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

// ─── Option button ────────────────────────────────────────────────────────────

const SELECTION_ACCENTS = [
  'bg-neonPink/45 border-neonPink',
  'bg-neonPurple/45 border-neonPurple',
  'bg-electricBlue/45 border-electricBlue',
  'bg-laserGreen/45 border-laserGreen',
  'bg-gold/45 border-gold',
] as const;

interface QuizOptionProps {
  label: string;
  sublabel?: string;
  value: string;
  optionIndex: number;
  isSelected: boolean;
  isLocked: boolean;
  subtle?: boolean;
  onPress: (value: string) => void;
}

function QuizOptionButton({ label, sublabel, value, optionIndex, isSelected, isLocked, subtle, onPress }: QuizOptionProps) {
  const accentClass = SELECTION_ACCENTS[optionIndex % SELECTION_ACCENTS.length];

  const handlePress = useCallback(() => {
    if (isLocked) return;
    onPress(value);
  }, [isLocked, onPress, value]);

  if (subtle) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isLocked}
        accessibilityRole="button"
        style={{ alignItems: 'center', paddingVertical: 8, opacity: isLocked ? 0.3 : 1 }}
      >
        <RNText style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          {label}
        </RNText>
      </Pressable>
    );
  }

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
          {label}
        </ThemedText>
        {sublabel ? (
          <ThemedText
            variant="caption"
            tone={isSelected ? 'default' : 'muted'}
            className={cn(isSelected && 'text-white/90')}
          >
            {sublabel}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Write-in input ───────────────────────────────────────────────────────────

interface WriteInInputProps {
  onSubmit: (value: string) => void;
  isLocked: boolean;
  label?: string;
  defaultExpanded?: boolean;
}

function WriteInInput({ onSubmit, isLocked, label = 'something else...', defaultExpanded = false }: WriteInInputProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
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
        <ThemedText variant="headline" tone="muted">{label}</ThemedText>
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

// ─── Age picker ───────────────────────────────────────────────────────────────

const AGES = Array.from({ length: 68 }, (_, i) => i + 13); // 13–80
const AGE_ITEM_H = 60;
const AGE_VISIBLE = 5;

function AgePicker({ onSelect, isLocked }: { onSelect: (v: string) => void; isLocked: boolean }) {
  const scrollRef = useRef<ScrollView>(null);
  const [age, setAge] = useState(22);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: (22 - 13) * AGE_ITEM_H, animated: false });
    }, 100);
  }, []);

  const handleScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / AGE_ITEM_H);
    setAge(AGES[Math.max(0, Math.min(AGES.length - 1, idx))]);
  }, []);

  return (
    <View style={{ gap: 20 }}>
      <View style={{ height: AGE_ITEM_H * AGE_VISIBLE, position: 'relative', overflow: 'hidden' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: AGE_ITEM_H * 2,
            left: 20,
            right: 20,
            height: AGE_ITEM_H,
            backgroundColor: 'rgba(191,95,255,0.12)',
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: 'rgba(191,95,255,0.4)',
            zIndex: 1,
          }}
        />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={AGE_ITEM_H}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: AGE_ITEM_H * 2 }}
        >
          {AGES.map(a => (
            <View key={a} style={{ height: AGE_ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
              <RNText style={{
                fontFamily: a === age ? 'Inter_800ExtraBold' : 'Inter_300Light',
                fontSize: a === age ? 38 : 22,
                color: a === age ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
              }}>
                {a}
              </RNText>
            </View>
          ))}
        </ScrollView>
      </View>
      <QuizOptionButton
        label={`That's me — ${age}`}
        value={String(age)}
        optionIndex={0}
        isSelected={false}
        isLocked={isLocked}
        onPress={onSelect}
      />
    </View>
  );
}

// ─── Rate app card ────────────────────────────────────────────────────────────

function RateCard({ onSelect, isLocked }: { onSelect: (v: string) => void; isLocked: boolean }) {
  const [hasRequested, setHasRequested] = useState(false);

  const handleLeaveRating = useCallback(async () => {
    const canReview = await StoreReview.isAvailableAsync();
    if (canReview) await StoreReview.requestReview();
    setHasRequested(true);
  }, []);

  return (
    <View style={{ gap: 8 }}>
      <QuizOptionButton
        label="Leave a rating"
        value="rate_leave"
        optionIndex={0}
        isSelected={false}
        isLocked={isLocked || hasRequested}
        onPress={handleLeaveRating}
      />
      {hasRequested && (
        <Pressable
          onPress={() => { if (!isLocked) onSelect('rate_yes'); }}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 8, opacity: isLocked ? 0.3 : 1 }}
        >
          <RNText style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            I rated ✓
          </RNText>
        </Pressable>
      )}
    </View>
  );
}

// ─── Age bucket helper ────────────────────────────────────────────────────────

function ageValueToBucket(value: string): string {
  const n = parseInt(value, 10);
  if (isNaN(n)) return value;
  if (n < 20) return 'age_teens';
  if (n < 25) return 'age_early20s';
  if (n < 30) return 'age_late20s';
  if (n < 40) return 'age_30s';
  return 'age_40plus';
}

// ─── Animated question slide ──────────────────────────────────────────────────

interface QuestionContentProps {
  questionId: string;
  prompt: string;
  subtitle?: string | null;
  options: QuizOption[];
  allowWriteIn?: boolean;
  writeInLabel?: string;
  writeInDefaultExpanded?: boolean;
  direction: 1 | -1;
  pendingSelection: string | null;
  onSelect: (value: string) => void;
}

function QuestionContent({
  questionId,
  prompt,
  subtitle,
  options,
  allowWriteIn,
  writeInLabel,
  writeInDefaultExpanded,
  direction,
  pendingSelection,
  onSelect,
}: QuestionContentProps) {
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
        <ThemedText variant="title">{prompt}</ThemedText>
        {subtitle ? (
          <ThemedText variant="body" tone="muted" className="font-vt323">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      <View className="gap-3">
        {questionId === 'age_range' ? (
          <AgePicker onSelect={onSelect} isLocked={pendingSelection !== null} />
        ) : questionId === 'rate_app' ? (
          <RateCard onSelect={onSelect} isLocked={pendingSelection !== null} />
        ) : (
          <>
            {options.map((opt, idx) => (
              <QuizOptionButton
                key={opt.value}
                label={opt.label}
                sublabel={opt.sublabel}
                value={opt.value}
                optionIndex={idx}
                isSelected={pendingSelection === opt.value}
                isLocked={pendingSelection !== null && pendingSelection !== opt.value}
                subtle={opt.subtle}
                onPress={onSelect}
              />
            ))}
            {allowWriteIn && (
              <WriteInInput
                key={questionId}
                onSubmit={onSelect}
                isLocked={pendingSelection !== null}
                label={writeInLabel}
                defaultExpanded={writeInDefaultExpanded}
              />
            )}
          </>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const QuizScreen: React.FC<Props> = ({ navigation }) => {
  const { tokens } = useTheme();
  const { addFavorite, removeFavorite } = useArtistPreferences();
  const analytics = useAnalytics();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastReaction, setLastReaction] = useState<string | null>(null);

  const pendingAnswersRef = useRef<Record<string, string>>({});
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const question = QUESTIONS[currentIndex];

  useEffect(() => {
    return () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); };
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      if (!question || pendingSelection) return;

      if (question.id === 'age_range') analytics.ageSelected(value);
      if (question.id === 'gender') analytics.genderSelected(value);

      // When user types an artist, normalise the name via OpenAI and store genre
      if (question.id === 'artist_lane' && value.startsWith('custom:')) {
        const rawName = value.slice(7);
        addFavorite(rawName);
        fetchArtistGenres(rawName).then(result => {
          setAnswers(prev => ({
            ...prev,
            artist_lane: `custom:${result.correctedName}`,
            inferred_genre: result.genres[0] ?? '',
          }));
          if (result.correctedName.toLowerCase() !== rawName.toLowerCase()) {
            removeFavorite(rawName);
            addFavorite(result.correctedName);
          }
        }).catch(() => {});
      }

      const nextAnswers = { ...answers, [question.id]: value };
      pendingAnswersRef.current = nextAnswers;
      setAnswers(nextAnswers);
      setPendingSelection(value);

      const lookupKey = question.id === 'age_range' ? ageValueToBucket(value) : value;
      const reaction = NARRATOR_REACTIONS[lookupKey] ?? null;

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        setPendingSelection(null);
        setLastReaction(reaction);

        if (currentIndex < QUESTIONS.length - 1) {
          setSlideDirection(1);
          setCurrentIndex(i => i + 1);
        } else {
          analytics.quizCompleted(pendingAnswersRef.current);
          navigation.navigate('Personality', { answers: pendingAnswersRef.current });
        }
      }, 250);
    },
    [analytics, answers, currentIndex, navigation, pendingSelection, question, addFavorite, removeFavorite],
  );

  const handleBack = useCallback(() => {
    if (pendingSelection || currentIndex === 0) return;
    setLastReaction(null);
    setSlideDirection(-1);
    setCurrentIndex(i => i - 1);
  }, [currentIndex, pendingSelection]);

  if (!question) {
    return (
      <StarryScreen className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </SafeAreaView>
      </StarryScreen>
    );
  }

  const resolvedPrompt = lastReaction ? `${lastReaction} ${question.prompt}` : question.prompt;

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
                <DiscoProgressBar current={currentIndex} total={QUESTIONS.length} />
              </View>

              <View style={{ overflow: 'hidden' }}>
                <QuestionContent
                  key={question.id}
                  questionId={question.id}
                  prompt={resolvedPrompt}
                  subtitle={question.subtitle}
                  options={question.options}
                  allowWriteIn={question.allowWriteIn}
                  writeInLabel={question.writeInLabel}
                  writeInDefaultExpanded={question.writeInDefaultExpanded}
                  direction={slideDirection}
                  pendingSelection={pendingSelection}
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
