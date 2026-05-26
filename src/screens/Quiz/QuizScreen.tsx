import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
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
import type { SpotifyArtist, SpotifyTrack } from '@src/api/hooks/useSpotifyTopData';
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

function pickDiverseArtists(artists: SpotifyArtist[]): Array<SpotifyArtist & { lane: string }> {
  const seenBuckets = new Set<string>();
  const picked: Array<SpotifyArtist & { lane: string }> = [];

  for (const artist of artists) {
    if (picked.length >= 4) break;
    const bucket = assignBucket(artist);
    if (bucket && !seenBuckets.has(bucket)) {
      seenBuckets.add(bucket);
      const lane = BUCKETS.find(b => b.key === bucket)?.label ?? '';
      picked.push({ ...artist, lane });
    }
  }

  // Fill to 4 if we couldn't find enough diverse buckets
  if (picked.length < 4) {
    const pickedIds = new Set(picked.map(a => a.id));
    for (const artist of artists) {
      if (picked.length >= 4) break;
      if (!pickedIds.has(artist.id)) {
        const bucket = assignBucket(artist);
        const lane = bucket ? (BUCKETS.find(b => b.key === bucket)?.label ?? '') : '';
        picked.push({ ...artist, lane });
        pickedIds.add(artist.id);
      }
    }
  }

  return picked;
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6) return 'late night';
  if (h < 12) return 'this morning';
  if (h < 17) return 'this afternoon';
  if (h < 21) return 'this evening';
  return 'tonight';
}

function buildQuestions(artists: SpotifyArtist[], tracks: SpotifyTrack[]): Question[] {
  const q3Artists = pickDiverseArtists(artists);
  const q3Ids = new Set(q3Artists.map(a => a.id));
  const q8Pool = artists.filter(a => !q3Ids.has(a.id)).slice(0, 4);
  const q6Tracks = tracks.slice(0, 4);
  const timeOfDay = getTimeOfDay();

  // Pad q8 if not enough artists
  const q8Options: Option[] = q8Pool.length >= 4
    ? q8Pool.map(a => ({ label: a.name, sublabel: '', emoji: '⏭️', value: a.id }))
    : [
        { label: 'Nobody right now', sublabel: 'I want it all', emoji: '🎵', value: 'none' },
        ...q8Pool.map(a => ({ label: a.name, sublabel: '', emoji: '⏭️', value: a.id })),
      ].slice(0, 4);

  return [
    {
      id: 'current_vibe',
      prompt: 'What are the vibes like right now?',
      options: [
        { label: 'Kinda tired', sublabel: 'just need something easy', emoji: '😴', value: 'tired' },
        { label: 'Ready to rage', sublabel: "let's go", emoji: '🔥', value: 'hype' },
        { label: 'On autopilot', sublabel: 'background noise only', emoji: '😶', value: 'autopilot' },
        { label: 'Warming up', sublabel: 'first drink in', emoji: '🍺', value: 'warming_up' },
        { label: 'Good mood', sublabel: 'no particular reason', emoji: '😊', value: 'good_mood' },
      ],
    },
    {
      id: 'discovery',
      prompt: 'Music discovery tolerance?',
      subtitle: 'What are you in the mood for?',
      options: [
        { label: 'Play the classics', sublabel: 'I know what I want', emoji: '📺', value: 'classics' },
        { label: 'Similar but fresh', sublabel: 'in my wheelhouse, never heard it', emoji: '🎲', value: 'familiar_fresh' },
        { label: 'Surprise me', sublabel: 'take me somewhere completely new', emoji: '🔍', value: 'explore' },
        { label: 'Deep cuts', sublabel: "stuff I've heard but forgot", emoji: '💎', value: 'deep_cuts' },
      ],
    },
    {
      id: 'artist_lane',
      prompt: "Who's calling to you today?",
      subtitle: 'Pick the one that fits right now',
      options: q3Artists.map(a => ({
        label: a.name,
        sublabel: a.lane,
        emoji: '🎵',
        value: a.id,
      })),
    },
    {
      id: 'location',
      prompt: `It's ${timeOfDay}. Where are you?`,
      options: [
        { label: 'In my room', sublabel: 'lights low', emoji: '🛋️', value: 'home_dark' },
        { label: 'Out and moving', sublabel: 'commute, walk, gym', emoji: '🚶', value: 'moving' },
        { label: 'At my desk', sublabel: 'trying to be productive', emoji: '💻', value: 'desk' },
        { label: 'Around people', sublabel: 'semi-social', emoji: '👥', value: 'social' },
      ],
    },
    {
      id: 'attention',
      prompt: 'How much attention are you giving the music?',
      options: [
        { label: 'Full attention', sublabel: 'this is the activity', emoji: '🎧', value: 'full' },
        { label: 'Half in', sublabel: "background but I'm still tracking it", emoji: '👂', value: 'half' },
        { label: 'Barely', sublabel: 'just need something on', emoji: '📻', value: 'background' },
        { label: 'Depends on the song', sublabel: "I'll zone in and out", emoji: '🎵', value: 'variable' },
      ],
    },
    {
      id: 'seed_track',
      prompt: 'Which would you tap play right now?',
      subtitle: 'No hesitation',
      options: q6Tracks.map(t => ({
        label: t.name,
        sublabel: t.artists.map(a => a.name).join(', '),
        emoji: '▶️',
        value: t.id,
      })),
    },
    {
      id: 'desired_effect',
      prompt: 'What do you want the music to do?',
      options: [
        { label: 'Match my mood', sublabel: "don't challenge it", emoji: '🪞', value: 'match' },
        { label: 'Pull me out of my head', sublabel: '', emoji: '🌀', value: 'escape' },
        { label: 'Give me energy', sublabel: "energy I don't currently have", emoji: '⚡', value: 'energise' },
        { label: 'Feel something', sublabel: "I've been avoiding it", emoji: '💭', value: 'feel' },
      ],
    },
    {
      id: 'skip_artist',
      prompt: 'Who would you skip right now?',
      subtitle: 'Even though you normally love them',
      options: q8Options,
    },
    {
      id: 'day_context',
      prompt: "How's the rest of your day looking?",
      subtitle: 'Be honest',
      options: [
        { label: 'Busy', sublabel: 'need to stay locked in', emoji: '📅', value: 'busy' },
        { label: 'Free', sublabel: 'nowhere to be', emoji: '🌅', value: 'free' },
        { label: 'Social later', sublabel: 'people at some point', emoji: '🍻', value: 'social' },
        { label: 'Unknown', sublabel: 'could go either way', emoji: '🎲', value: 'unknown' },
      ],
    },
    {
      id: 'playback_style',
      prompt: 'Shuffle or curated?',
      subtitle: 'Last one',
      options: [
        { label: 'Shuffle everything', sublabel: 'chaos is fine', emoji: '🔀', value: 'shuffle' },
        { label: 'Artist radio', sublabel: 'one artist and let it ride', emoji: '📻', value: 'radio' },
        { label: 'Trust the curator', sublabel: 'someone else built it', emoji: '🎯', value: 'curated' },
        { label: 'One song on repeat', sublabel: "until I'm done with it", emoji: '🔁', value: 'repeat' },
      ],
    },
  ].filter(q => q.options.length > 0);
}

// ─── Analysis log ─────────────────────────────────────────────────────────────

function logAnalysis(answers: Record<string, string>, questions: Question[]) {
  const labelFor = (qId: string, val: string) => {
    const opt = questions.find(q => q.id === qId)?.options.find(o => o.value === val);
    return opt ? `${opt.label}${opt.sublabel ? ` — ${opt.sublabel}` : ''}` : val;
  };

  const vibeMap: Record<string, [number, number]> = {
    tired:      [0.30, 0.40],
    hype:       [0.90, 0.80],
    autopilot:  [0.45, 0.50],
    warming_up: [0.60, 0.65],
    good_mood:  [0.65, 0.75],
  };
  const popularityMap: Record<string, [number, number]> = {
    classics:       [70, 100],
    familiar_fresh: [40, 75],
    explore:        [0,  50],
    deep_cuts:      [15, 55],
  };
  const instrumentalnessMap: Record<string, number> = {
    full: 0.1, half: 0.3, background: 0.6, variable: 0.2,
  };

  let [energy, valence] = vibeMap[answers.current_vibe] ?? [0.5, 0.5];
  if (answers.location === 'moving') energy = Math.min(1, energy + 0.1);
  if (answers.location === 'home_dark') energy = Math.max(0, energy - 0.1);
  if (answers.desired_effect === 'energise') energy = Math.min(1, energy + 0.2);
  if (answers.desired_effect === 'escape') valence = Math.min(1, valence + 0.2);

  const [minPop, maxPop] = popularityMap[answers.discovery] ?? [30, 80];

  const spotifyParams: Record<string, string | number> = {
    seed_artists: answers.artist_lane ?? '',
    seed_tracks: answers.seed_track ?? '',
    target_energy: parseFloat(energy.toFixed(2)),
    target_valence: parseFloat(valence.toFixed(2)),
    min_popularity: minPop,
    max_popularity: maxPop,
    target_instrumentalness: instrumentalnessMap[answers.attention] ?? 0.2,
  };
  if (answers.skip_artist && answers.skip_artist !== 'none') {
    spotifyParams.exclude_artist = answers.skip_artist;
  }

  console.log('[Quiz] ✅ Complete\n');
  console.log('CONTEXT');
  console.log('  Vibe:      ', labelFor('current_vibe', answers.current_vibe));
  console.log('  Location:  ', labelFor('location', answers.location));
  console.log('  Attention: ', labelFor('attention', answers.attention));
  console.log('  Day:       ', labelFor('day_context', answers.day_context));
  console.log('\nMUSIC PREFERENCES');
  console.log('  Discovery:      ', labelFor('discovery', answers.discovery));
  console.log('  Artist lane:    ', labelFor('artist_lane', answers.artist_lane));
  console.log('  Seed track:     ', labelFor('seed_track', answers.seed_track));
  console.log('  Skip:           ', labelFor('skip_artist', answers.skip_artist));
  console.log('  Desired effect: ', labelFor('desired_effect', answers.desired_effect));
  console.log('  Playback:       ', labelFor('playback_style', answers.playback_style));
  console.log('\nDERIVED SPOTIFY PARAMS');
  console.log(JSON.stringify(spotifyParams, null, 2));
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

const ADVANCE_AFTER_SELECT_MS = 500;

interface OptionPressableProps {
  option: Option;
  optionIndex: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: (value: string) => void;
  layout: 'card' | 'row';
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

function QuizOption({ option, optionIndex, isSelected, isLocked, onPress, layout }: OptionPressableProps) {
  const accentClass = SELECTION_ACCENTS[optionIndex % SELECTION_ACCENTS.length];

  const handlePress = useCallback(() => {
    if (isLocked) return;
    onPress(option.value);
  }, [isLocked, onPress, option.value]);

  const baseClass =
    layout === 'card'
      ? 'flex-1 rounded-3xl items-center justify-center gap-2 px-3 py-4 border-2'
      : 'flex-row items-center gap-4 px-4 py-4 rounded-2xl border-2';

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLocked}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isLocked }}
      className={cn(
        baseClass,
        isSelected
          ? accentClass
          : 'bg-surface dark:bg-surfaceDark border-border dark:border-borderDark',
        isLocked && !isSelected && 'opacity-35',
        !isLocked && !isSelected && 'active:opacity-70',
      )}
    >
      <View className={layout === 'row' ? 'flex-1' : undefined}>
        <ThemedText
          variant="headline"
          className={cn(layout === 'card' && 'text-center', isSelected && 'text-white font-nunito-extrabold')}
        >
          {option.label}
        </ThemedText>
        {option.sublabel ? (
          <ThemedText
            variant="caption"
            tone={isSelected ? 'default' : 'muted'}
            className={cn(layout === 'card' && 'text-center px-1', isSelected && 'text-white/90')}
          >
            {option.sublabel}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const QuizScreen: React.FC<Props> = ({ navigation }) => {
  const { tokens } = useTheme();
  const { data: topData } = useSpotifyTopData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = useMemo(
    () => (topData ? buildQuestions(topData.artists, topData.tracks) : []),
    [topData],
  );

  const question = questions[currentIndex];

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
          setCurrentIndex(i => i + 1);
          return;
        }

        logAnalysis(nextAnswers, questions);
        navigation.navigate('Results', { answers: nextAnswers });
      }, ADVANCE_AFTER_SELECT_MS);
    },
    [answers, currentIndex, navigation, pendingSelection, question, questions],
  );

  const handleBack = useCallback(() => {
    if (pendingSelection) return;
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex, pendingSelection]);

  if (!question) {
    return (
      <StarryScreen className="flex-1">
        <SafeAreaView className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </SafeAreaView>
      </StarryScreen>
    );
  }

  const useRowLayout = question.options.length >= 5 || question.options.length <= 2;

  return (
    <StarryScreen className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6 pt-6 pb-10 gap-6">

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

          <View className="flex-1 gap-6">
            <View className="gap-1.5">
              <ThemedText variant="title">{question.prompt}</ThemedText>
              {question.subtitle ? (
                <ThemedText variant="body" tone="muted" className="font-vt323">
                  {question.subtitle}
                </ThemedText>
              ) : null}
            </View>

            <View className="flex-1 gap-3">
              {useRowLayout ? (
                question.options.map((opt, optionIndex) => (
                  <QuizOption
                    key={opt.value}
                    option={opt}
                    optionIndex={optionIndex}
                    layout="row"
                    isSelected={pendingSelection === opt.value}
                    isLocked={pendingSelection !== null && pendingSelection !== opt.value}
                    onPress={handleSelect}
                  />
                ))
              ) : (
                <>
                  <View className="flex-row gap-4 flex-1">
                    {question.options.slice(0, 2).map((opt, optionIndex) => (
                      <QuizOption
                        key={opt.value}
                        option={opt}
                        optionIndex={optionIndex}
                        layout="card"
                        isSelected={pendingSelection === opt.value}
                        isLocked={pendingSelection !== null && pendingSelection !== opt.value}
                        onPress={handleSelect}
                      />
                    ))}
                  </View>
                  <View className="flex-row gap-4 flex-1">
                    {question.options.slice(2, 4).map((opt, optionIndex) => (
                      <QuizOption
                        key={opt.value}
                        option={opt}
                        optionIndex={optionIndex + 2}
                        layout="card"
                        isSelected={pendingSelection === opt.value}
                        isLocked={pendingSelection !== null && pendingSelection !== opt.value}
                        onPress={handleSelect}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>

        </View>
      </SafeAreaView>
    </StarryScreen>
  );
};
