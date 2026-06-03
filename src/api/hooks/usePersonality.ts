import { useQuery } from '@tanstack/react-query';

import { useSpotifyTopData, type TopData } from './useSpotifyTopData';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export interface PersonalityResult {
  title: string;
  subtitle: string;
  emoji: string;
  color: 'pink' | 'purple' | 'blue' | 'gold' | 'green';
}

const VIBE_LABEL: Record<string, string> = {
  ready_to_disco: 'party mode, social, high energy — has the aux',
  on_autopilot: 'autopilot, background listening, low effort',
  winding_down: 'winding down, slow and intentional',
  road_soda: 'driving somewhere, in the car',
};

const ERA_LABEL: Record<string, string> = {
  classic: 'pre-90s classics',
  throwback: '90s and 2000s nostalgia',
  recent: '2010s',
  now: 'current releases only',
  surprise: 'no preference, any era',
};

const SCENARIO_LABEL: Record<string, string> = {
  singalong: 'wants the hits they already know',
  popular: 'mix of familiar and new',
  deep_cuts: 'deep cuts and hidden gems only',
};

const ARTIST_WHY_LABEL: Record<string, string> = {
  show_them: 'immediately shows people what they\'re listening to — proud of their taste',
  hard_to_explain: 'their taste is hard to explain to others',
  would_lie: 'keeps their real playlist private',
  made_them_playlist: 'already made someone a playlist — natural curator',
};

async function fetchPersonality(
  answers: Record<string, string>,
  topData: TopData,
): Promise<PersonalityResult> {
  const topArtistNames = topData.artists.slice(0, 5).map(a => a.name).join(', ');
  const topTrackNames = topData.tracks
    .slice(0, 3)
    .map(t => `${t.name} by ${t.artists[0]?.name ?? 'unknown'}`)
    .join(', ');

  const isCustomArtist = answers.artist_lane?.startsWith('custom:');
  const chosenArtist = !isCustomArtist
    ? topData.artists.find(a => a.id === answers.artist_lane)
    : null;
  const artistName =
    chosenArtist?.name ?? (isCustomArtist ? answers.artist_lane.slice(7) : null);

  const aspect =
    answers.artist_aspect?.startsWith('aspect:') && answers.artist_aspect !== 'aspect:all'
      ? answers.artist_aspect.slice(7)
      : null;

  const prompt = [
    'Create a music personality archetype for this Spotify user based on their quiz and listening history.',
    '',
    'Quiz answers:',
    `- Context: ${VIBE_LABEL[answers.current_vibe] ?? answers.current_vibe ?? 'unknown'}`,
    artistName ? `- Artist they are feeling right now: ${artistName}` : null,
    aspect ? `- Specifically drawn to: ${aspect}` : null,
    `- Era preference: ${ERA_LABEL[answers.era] ?? answers.era ?? 'no preference'}`,
    `- Discovery style: ${SCENARIO_LABEL[answers.listening_scenario] ?? answers.listening_scenario ?? 'unknown'}`,
    ARTIST_WHY_LABEL[answers.artist_why]
      ? `- Music sharing personality: ${ARTIST_WHY_LABEL[answers.artist_why]}`
      : null,
    '',
    `Top Spotify artists: ${topArtistNames}`,
    `Recently played tracks: ${topTrackNames}`,
    '',
    'Return JSON with exactly these fields:',
    '{',
    '  "title": "3-5 word archetype name in ALL CAPS — dramatic, identity-level, can start with THE",',
    '  "subtitle": "one punchy sentence that feels personal — reference their actual artist or genre cluster, make them feel seen",',
    '  "emoji": "single most fitting emoji for this archetype",',
    '  "color": "one of: pink, purple, blue, gold, green"',
    '}',
    '',
    'Good title examples: "THE MIDNIGHT CURATOR", "UNDERGROUND SOUND HUNTER", "NOSTALGIC TIME TRAVELER", "THE AUX CORD GUARDIAN", "BEDROOM POP ARCHIVIST"',
    'The subtitle should feel like it gets them — specific and slightly flattering, not generic.',
    'Color guide: pink = social/party, purple = deep/mysterious, blue = calm/driving, gold = nostalgic/classic, green = discovery/underground',
  ].filter(Boolean).join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 150,
      temperature: 0.9,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI failed (${res.status})`);

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as Partial<PersonalityResult>;

  const validColors: PersonalityResult['color'][] = ['pink', 'purple', 'blue', 'gold', 'green'];

  return {
    title: parsed.title ?? 'THE VIBE CURATOR',
    subtitle: parsed.subtitle ?? 'Your taste speaks for itself.',
    emoji: parsed.emoji ?? '🎵',
    color: validColors.includes(parsed.color as PersonalityResult['color'])
      ? (parsed.color as PersonalityResult['color'])
      : 'purple',
  };
}

export function usePersonality(answers: Record<string, string>) {
  const { data: topData } = useSpotifyTopData();
  const enabled = !!topData && Object.keys(answers).length > 0;

  return useQuery({
    queryKey: ['personality', answers],
    queryFn: () => fetchPersonality(answers, topData!),
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
}
