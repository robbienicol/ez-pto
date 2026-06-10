import { useQuery } from '@tanstack/react-query';

import { useArtistPreferences } from '@src/state/artistPreferences/ArtistPreferencesProvider';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export interface PersonalityResult {
  title: string;
  subtitle: string;
  color: 'pink' | 'purple' | 'blue' | 'gold' | 'green';
  musicIdentity: string;
  growthDirection: string;
  artistsToExplore: string[];
  blindSpot: string;
}

const AGE_LABEL: Record<string, string> = {
  age_teens:    'under 20',
  age_early20s: '20–24',
  age_late20s:  '25–29',
  age_30s:      '30–39',
  age_40plus:   '40+',
};

const GENDER_LABEL: Record<string, string> = {
  gender_man:   'male',
  gender_woman: 'female',
  gender_nb:    'non-binary',
  gender_skip:  'prefers not to say',
};

const LIFE_PHASE_LABEL: Record<string, string> = {
  locked_in:    'goal-driven, building mode — career or project focused, disciplined',
  figuring_out: 'transitional, open, still discovering their direction in life',
  peak_social:  'highly social, event-driven, surrounded by people and energy',
  own_world:    'introspective, self-contained, low-key lifestyle, minimal drama',
};

const SOCIAL_ENERGY_LABEL: Record<string, string> = {
  energy_social:       'extrovert — always with people, group chats popping, social energy is high',
  energy_small_circle: 'introvert with a small circle — deep with a few people, real conversations, not interested in the crowd',
  energy_solo:         'solo preference — headphones in, doing their own thing, internal energy, mostly in their own world',
  energy_mixed:        'ambivert — social when they want to be, alone when they need to be, goes either way',
};

const SOCIAL_SELF_LABEL: Record<string, string> = {
  the_fun_one:       'magnetic, high-energy, socially sought after — the one everyone wants around',
  the_deep_one:      'thoughtful and substantive, values real conversations over surface-level interaction',
  the_ambitious_one: 'driven and competitive, visibly working toward something, goal-oriented',
  the_chill_one:     'easygoing, low-maintenance, relaxed — hard to rattle or excite',
};

const MUSIC_SCENE_LABEL: Record<string, string> = {
  scene_underground: 'underground kid — record shops, obscure bands, Joy Division, heard it before anyone',
  scene_pop:         'pop culture fan — lives for chart moments, Taylor Swift eras, every cultural banger',
  scene_emotional:   'late night listener — Frank Ocean energy, 2am drives, music that makes them feel something real',
  scene_explorer:    'constant digger — Shazam addict, always finding the next thing, playlist always evolving',
  scene_energy:      'energy chaser — club, gym, concerts, needs music with momentum and power',
};

const CURRENT_MUSIC_LABEL: Record<string, string> = {
  music_rap:      'primarily rap and hip-hop',
  music_pop:      'mainstream pop and chart music',
  music_rock:     'rock or alternative — guitar-driven, energetic, something with edge',
  music_rnb:      'r&b and soul — smooth, emotional, feeling-driven',
  music_eclectic: 'eclectic mix with no dominant genre, mood-dependent listening',
};

const MISSING_QUALITY_LABEL: Record<string, string> = {
  want_cool:     'wants to be perceived as effortlessly cool and stylish',
  want_deep:     'wants to be seen as intellectually interesting and worth knowing',
  want_intense:  'wants to be perceived as focused, driven, and serious',
  want_magnetic: 'wants to be the kind of person who lights up a room and draws people in',
  want_creative: 'wants to be recognized as a creative and expressive person',
};

const ERA_RESONANCE_LABEL: Record<string, string> = {
  era_70s:   '1970s — soul, funk, analog warmth, confident swagger',
  era_90s:   '1990s — raw, gritty, alternative or hip-hop, nothing was polished',
  era_2000s: '2000s — peak pop culture, maximalist, confident, culturally dominant',
  era_2010s: '2010s — indie blog era, lo-fi, discovery-driven, everything felt like a find',
  era_now:   'current 2020s releases — not looking back, living in the present',
};

async function fetchPersonality(
  answers: Record<string, string>,
  favoriteArtists: string[],
): Promise<PersonalityResult> {
  const artistName = answers.artist_lane?.startsWith('custom:')
    ? answers.artist_lane.slice(7)
    : null;

  const prompt = [
    'You are a music consultant who reads personality and lifestyle signals to prescribe a music direction.',
    'Your job is NOT to validate what this person already listens to.',
    'Your job is to look at who they are — their personality, lifestyle, aspirations, and the era they resonate with — and tell them what music they SHOULD be exploring.',
    'This is prescriptive and exciting, not just descriptive.',
    '',
    'Here is who this person is:',
    answers.age_range         ? `- Age: ${/^\d+$/.test(answers.age_range) ? answers.age_range : (AGE_LABEL[answers.age_range] ?? answers.age_range)}` : null,
    answers.gender            ? `- Gender: ${GENDER_LABEL[answers.gender] ?? answers.gender}` : null,
    answers.life_phase        ? `- Life phase: ${LIFE_PHASE_LABEL[answers.life_phase] ?? answers.life_phase}` : null,
    answers.social_energy     ? `- Social energy / personality type: ${SOCIAL_ENERGY_LABEL[answers.social_energy] ?? answers.social_energy}` : null,
    answers.social_self       ? `- How friends describe them: ${SOCIAL_SELF_LABEL[answers.social_self] ?? answers.social_self}` : null,
    answers.instruments       ? `- Plays an instrument: ${{ plays_yes: 'yes', plays_used_to: 'used to', plays_learning: 'no but wants to learn', plays_no: 'no — pure listener' }[answers.instruments] ?? answers.instruments}` : null,
    answers.music_scene       ? `- Music scene they identify with: ${MUSIC_SCENE_LABEL[answers.music_scene] ?? answers.music_scene}` : null,
    artistName                ? `- Artist they are listening to right now: ${artistName}` : null,
    answers.current_music     ? `- Current playlist sound: ${CURRENT_MUSIC_LABEL[answers.current_music] ?? answers.current_music}` : null,
    answers.missing_quality   ? `- Quality they want to be known for: ${MISSING_QUALITY_LABEL[answers.missing_quality] ?? answers.missing_quality}` : null,
    answers.era_resonance     ? `- Era energy they want to channel: ${ERA_RESONANCE_LABEL[answers.era_resonance] ?? answers.era_resonance}` : null,
    favoriteArtists.length > 0 ? `- Other artists they like: ${favoriteArtists.slice(0, 4).join(', ')}` : null,
    '',
    'Give them a music identity that reflects who they are becoming, not just what they already play.',
    'The full report will include curated Spotify playlists — your job is to build the identity and direction that those playlists will deliver on.',
    '',
    'Return JSON with exactly these fields:',
    '{',
    '  "title": "3-5 word music archetype in ALL CAPS, starting with THE. This should feel like a music identity they are stepping into, not a genre label.",',
    '  "subtitle": "one punchy sentence. Make them feel like you read something specific about them. Reference their personality or era, not just their genre.",',
    '  "color": "one of: pink, purple, blue, gold, green",',
    '  "musicIdentity": "3-4 sentences. Open by naming what their current taste and personality reveal. Then pivot hard: tell them specifically what they should be listening to and why — name genres, scenes, movements, or eras. Be prescriptive and confident. This is a recommendation, not a description.",',
    '  "growthDirection": "one actionable sentence starting with a verb. Name a specific genre, scene, or artist they should go deep on next — something adjacent to where they are but they have not fully committed to.",',
    '  "artistsToExplore": ["5-7 specific artist names they should be listening to based on their identity. Mix of entry points and deeper cuts. Real artists only."],',
    '  "blindSpot": "one punchy sentence naming the one genre, scene, or era they are sleeping on that would fit them perfectly — the thing they have not discovered yet but would love."',
    '}',
    '',
    'Color guide: pink = social/expressive, purple = deep/mysterious, blue = cinematic/calm, gold = nostalgic/classic, green = exploratory/underground',
    'Title examples: "THE MIDNIGHT ARCHIVIST", "THE ANALOG ROMANTIC", "THE GOLDEN HOUR REALIST", "THE OBSESSIVE CURATOR", "THE QUIET MAXIMALIST"',
  ].filter(Boolean).join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.85,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI failed (${res.status})`);

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as Partial<PersonalityResult>;

  const validColors: PersonalityResult['color'][] = ['pink', 'purple', 'blue', 'gold', 'green'];

  return {
    title:           parsed.title ?? 'THE VIBE CURATOR',
    subtitle:        parsed.subtitle ?? 'Your taste speaks for itself.',
    color:           validColors.includes(parsed.color as PersonalityResult['color'])
                       ? (parsed.color as PersonalityResult['color'])
                       : 'purple',
    musicIdentity:    parsed.musicIdentity ?? '',
    growthDirection:  parsed.growthDirection ?? '',
    artistsToExplore: Array.isArray(parsed.artistsToExplore) ? parsed.artistsToExplore.slice(0, 7) : [],
    blindSpot:        parsed.blindSpot ?? '',
  };
}

export function usePersonality(answers: Record<string, string>) {
  const { favoriteArtists } = useArtistPreferences();
  const enabled = Object.keys(answers).length > 0;

  return useQuery({
    queryKey: ['personality', answers],
    queryFn: () => fetchPersonality(answers, favoriteArtists),
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
}
