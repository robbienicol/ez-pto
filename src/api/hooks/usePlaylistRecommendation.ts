import { useQuery } from '@tanstack/react-query';

import { useArtistPreferences } from '@src/state/artistPreferences/ArtistPreferencesProvider';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const SERPER_KEY = process.env.EXPO_PUBLIC_SERPER_API_KEY ?? '';

// ─── Answer label maps ────────────────────────────────────────────────────────

const VIBE: Record<string, string> = {
  ready_to_disco: 'high energy, ready to go',
  half_asleep: 'low energy, barely functioning',
  on_autopilot: 'background listening, chill',
  road_soda: 'driving, on the move',
  winding_down: 'calm and winding down',
};

const VIBE_ENERGY: Record<string, string> = {
  ready_to_disco: 'high energy, party or social setting — the playlist MUST feel upbeat and energetic, nothing slow or sad',
  road_soda: 'car/driving context — needs to work as a driving playlist, good forward momentum',
  winding_down: 'slow and calm is exactly right here',
};

const MAINSTREAM: Record<string, string> = {
  hits: 'popular chart hits',
  popular: 'well-known but not overplayed',
  deep_cuts: 'deep cuts and lesser-known tracks',
  obscure: 'underground and obscure',
  singalong: 'popular chart hits',
  nostalgic: 'well-known but not overplayed',
  discovery: 'underground and obscure',
};

const VOCALS: Record<string, string> = {
  vocals: 'with vocals',
  instrumental: 'instrumental only',
  either: '',
};

const ERA: Record<string, string> = {
  classic:   'pre-1990s, vintage, classic era',
  throwback: '1990s and 2000s',
  recent:    '2010s',
  now:       'current, 2020s, recent releases',
  surprise:  'any era — pick whatever best fits the overall vibe',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlaylistResult {
  id: string;
  name: string;
  description: string;
  spotifyUrl: string;
  thumbnailUrl: string | null;
}

export interface PlaylistSearchResult {
  searchQuery: string;
  playlists: PlaylistResult[];
}

// ─── OpenAI — generate search query ──────────────────────────────────────────

async function buildSearchQuery(
  answers: Record<string, string>,
  favoriteArtists: string[],
  skipArtists: string[],
): Promise<string> {
  const artistName = answers.artist_lane?.startsWith('custom:')
    ? answers.artist_lane.slice(7)
    : null;

  const hasArtist = !!artistName;
  const selectedGenre = answers.genre_vibe?.startsWith('genre:') ? answers.genre_vibe.slice(6) : null;
  const eraText = answers.era ? ERA[answers.era] ?? answers.era : null;
  const skipClause = skipArtists.length > 0
    ? `Do NOT generate a query that would surface playlists primarily focused on: ${skipArtists.join(', ')}`
    : null;

  const aspect =
    answers.artist_aspect?.startsWith('aspect:') && answers.artist_aspect !== 'aspect:all'
      ? answers.artist_aspect.slice(7)
      : null;

  let prompt: string;

  if (hasArtist) {
    prompt = [
      `Generate a 3-6 word Spotify playlist search query to find playlists where ${artistName} would be curated alongside similar artists.`,
      ``,
      `Think: what would a human curator write as the name or description of a playlist that includes ${artistName}?`,
      ``,
      `Artist: ${artistName}`,
      favoriteArtists.length > 1
        ? `Listener also likes: ${favoriteArtists.filter(a => a !== artistName).slice(0, 3).join(', ')}`
        : null,
      selectedGenre ? `Confirmed genre the listener wants right now: ${selectedGenre} — reflect this in the query` : null,
      aspect ? `The listener specifically connects with: ${aspect} — weight this heavily in the query` : null,
      eraText ? `Era: ${eraText}` : null,
      VIBE_ENERGY[answers.current_vibe] ? `Energy constraint: ${VIBE_ENERGY[answers.current_vibe]}` : null,
      skipClause,
      ``,
      `Return JSON: { "query": "your search query here" }`,
      `The query must sound like a real playlist title a human curator would write.`,
      `Never use: "chill", "vibes", "relaxing", "good music", "playlist".`,
      `Examples: "dreamy psych pop gems", "weirdo girl indie", "underground psych garage", "lo-fi bedroom discoveries"`,
      `Keep it 3-6 words.`,
    ].filter(Boolean).join('\n');
  } else {
    const vibeText = answers.current_vibe?.startsWith('custom:')
      ? `Their drink choice is "${answers.current_vibe.slice(7)}" — infer the energy and mood this drink implies`
      : (VIBE[answers.current_vibe] ?? answers.current_vibe);

    prompt = [
      `Generate a concise Spotify playlist search query (3-6 words) based on this listener's vibe.`,
      ``,
      `Vibe: ${vibeText}`,
      `Popularity: ${MAINSTREAM[answers.listening_scenario] ?? answers.listening_scenario}`,
      answers.vocals !== 'either' ? `Vocals: ${VOCALS[answers.vocals] ?? ''}` : null,
      eraText ? `Era: ${eraText}` : null,
      favoriteArtists.length > 0 ? `Listener likes: ${favoriteArtists.slice(0, 3).join(', ')}` : null,
      skipClause,
      ``,
      `Return JSON: { "query": "your search query here" }`,
      `Examples: "90s country classics", "late night jazz instrumental", "soft indie acoustic rainy day"`,
      `Keep it 3-6 words. Include the era when relevant.`,
    ].filter(Boolean).join('\n');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 60,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as { query?: string };
  return parsed.query ?? 'feel good indie playlist';
}

// ─── Serper — web search for Spotify playlists ────────────────────────────────

interface SerperOrganic {
  link: string;
  title: string;
  snippet?: string;
}

async function searchWebForPlaylists(query: string): Promise<{ id: string; name: string; description: string; spotifyUrl: string }[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `site:open.spotify.com/playlist ${query}`, num: 10 }),
  });

  if (!res.ok) {
    console.warn(`[playlist] Serper search failed (${res.status})`);
    return [];
  }

  const data = await res.json();
  const seen = new Set<string>();

  return ((data.organic ?? []) as SerperOrganic[])
    .map(r => {
      const id = r.link.match(/playlist\/([A-Za-z0-9]+)/)?.[1];
      if (!id || seen.has(id)) return null;
      seen.add(id);
      const name = r.title.split(' • ')[0]?.trim() ?? r.title;
      return {
        id,
        name,
        description: r.snippet ?? '',
        spotifyUrl: `https://open.spotify.com/playlist/${id}`,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

// ─── Spotify oembed — fetch thumbnail ────────────────────────────────────────

async function fetchThumbnail(playlistId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=https://open.spotify.com/playlist/${playlistId}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.thumbnail_url as string | undefined) ?? null;
  } catch {
    return null;
  }
}

// ─── Scenario-based selection (using search rank as popularity proxy) ─────────

function pickByScenario(
  candidates: { id: string; name: string; description: string; spotifyUrl: string }[],
  scenario: string,
): typeof candidates {
  const m = candidates.length;
  if (m === 0) return [];

  if (scenario === 'obscure' || scenario === 'discovery' || scenario === 'deep_cuts') {
    return candidates.slice(Math.max(0, m - 3)).reverse();
  }

  const startFraction: Record<string, number> = {
    hits: 0, singalong: 0,
    popular: 0.25, nostalgic: 0.25,
  };
  const frac = startFraction[scenario] ?? 0;
  const startIdx = Math.min(Math.floor(m * frac), Math.max(0, m - 3));
  return candidates.slice(startIdx, startIdx + 3);
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function findPlaylists(
  answers: Record<string, string>,
  favoriteArtists: string[],
  skipArtists: string[],
): Promise<PlaylistSearchResult> {
  const searchQuery = await buildSearchQuery(answers, favoriteArtists, skipArtists);
  console.log('[playlist] query:', searchQuery);

  const raw = await searchWebForPlaylists(searchQuery);
  const picked = pickByScenario(raw, answers.listening_scenario ?? 'hits').slice(0, 3);

  const thumbnails = await Promise.all(picked.map(p => fetchThumbnail(p.id)));

  const playlists: PlaylistResult[] = picked.map((p, i) => ({
    ...p,
    thumbnailUrl: thumbnails[i] ?? null,
  }));

  return { searchQuery, playlists };
}

// ─── Demo mode ────────────────────────────────────────────────────────────────

const DEMO_RESULT: PlaylistSearchResult = {
  searchQuery: 'indie electronic dream pop',
  playlists: [
    {
      id: 'demo_p1',
      name: 'late night frequencies',
      description: 'electronic and indie for the hours when everything slows down',
      spotifyUrl: 'https://open.spotify.com/genre/indie-page',
      thumbnailUrl: null,
    },
    {
      id: 'demo_p2',
      name: 'bedroom pop essentials',
      description: 'intimate, lo-fi, and just a little hazy',
      spotifyUrl: 'https://open.spotify.com/genre/lofi-page',
      thumbnailUrl: null,
    },
    {
      id: 'demo_p3',
      name: 'underground sounds',
      description: 'hidden gems from the edges of indie and electronic',
      spotifyUrl: 'https://open.spotify.com/genre/electronic-page',
      thumbnailUrl: null,
    },
  ],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaylistRecommendation(answers: Record<string, string>) {
  const { favoriteArtists, skipArtists } = useArtistPreferences();
  const isDemo = answers._demo === 'true';

  return useQuery({
    queryKey: ['playlist-search', answers],
    queryFn: () => {
      if (isDemo) return DEMO_RESULT;
      return findPlaylists(answers, favoriteArtists, skipArtists);
    },
    enabled: Object.keys(answers).length > 0,
    staleTime: Infinity,
    retry: 1,
  });
}
