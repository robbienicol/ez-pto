import { useQuery } from '@tanstack/react-query';

import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { useSpotifyTopData, type TopData } from './useSpotifyTopData';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

// ─── Answer label maps ────────────────────────────────────────────────────────

const VIBE: Record<string, string> = {
  ready_to_disco: 'high energy, ready to go',
  half_asleep: 'low energy, barely functioning',
  on_autopilot: 'background listening, chill',
  feeling_creative: 'inspired and creative',
  winding_down: 'calm and winding down',
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
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpotifyPlaylistResult {
  id: string;
  name: string;
  description: string;
  external_urls: { spotify: string };
  images: { url: string; height: number | null; width: number | null }[];
  tracks: { total: number } | null;
  owner: { display_name: string; id: string };
}

export interface PlaylistSearchResult {
  searchQuery: string;
  playlists: SpotifyPlaylistResult[];
}

// ─── OpenAI — generate search query ──────────────────────────────────────────

async function buildSearchQuery(
  answers: Record<string, string>,
  topData: TopData,
): Promise<string> {
  const isCustomArtist = answers.artist_lane?.startsWith('custom:');
  const chosenArtist = isCustomArtist
    ? null
    : topData.artists.find(a => a.id === answers.artist_lane);
  const artistName = chosenArtist?.name ?? (isCustomArtist ? answers.artist_lane.slice(7) : null);
  const artistGenres = chosenArtist?.genres ?? [];

  const vibeText = answers.current_vibe?.startsWith('custom:')
    ? `Their drink choice is "${answers.current_vibe.slice(7)}" — infer the energy and mood this drink implies`
    : (VIBE[answers.current_vibe] ?? answers.current_vibe);

  const prompt = [
    `Generate a concise Spotify playlist search query (3-6 words) based on this listener's vibe.`,
    ``,
    `Vibe: ${vibeText}`,
    `Artist/genre they want: ${artistName ?? 'unspecified'}`,
    artistGenres.length > 0 ? `Genres: ${artistGenres.slice(0, 3).join(', ')}` : '',
    `Popularity: ${MAINSTREAM[answers.listening_scenario] ?? answers.listening_scenario}`,
    answers.vocals !== 'either' ? `Vocals: ${VOCALS[answers.vocals] ?? ''}` : '',
    answers.era ? `Era: ${ERA[answers.era] ?? answers.era}` : '',
    ``,
    `Return JSON: { "query": "your search query here" }`,
    `Examples: "90s country classics", "late night jazz instrumental", "soft indie acoustic rainy day"`,
    `Do not include artist names. Focus on genre, mood, era, or energy level. Include the era in the query when relevant.`,
  ].filter(Boolean).join('\n');

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
  return parsed.query ?? 'chill playlist';
}

// ─── Spotify — search for playlists ──────────────────────────────────────────

type RawPlaylist = {
  id: string;
  name: string;
  description: string;
  external_urls: { spotify: string };
  images: { url: string; height: number | null; width: number | null }[];
  tracks: { total: number } | null;
  owner: { display_name: string; id: string };
};

function isSpotifyOwned(owner: { display_name?: string; id: string }): boolean {
  const id = owner.id.toLowerCase();
  const name = (owner.display_name ?? '').toLowerCase();
  return id.includes('spotify') || name.includes('spotify');
}

// Spotify search caps at 10 per call — fetch two pages in parallel to get 20
async function fetchPlaylistPage(q: string, offset: number, accessToken: string): Promise<Array<RawPlaylist | null>> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=playlist&limit=10&offset=${offset}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify search failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.playlists?.items ?? []) as Array<RawPlaylist | null>;
}

// Map listening_scenario to a fractional start position within the result pool.
// obscure gets the bottom of the list, hits the top, others scale linearly between.
function pickByScenario(playlists: RawPlaylist[], scenario: string): RawPlaylist[] {
  const n = playlists.length;
  if (n === 0) return [];

  if (scenario === 'obscure' || scenario === 'discovery') {
    return [...playlists].slice(Math.max(0, n - 3)).reverse();
  }

  const startFraction: Record<string, number> = {
    hits:      0,
    singalong: 0,
    popular:   0.25,
    nostalgic: 0.25,
    deep_cuts: 0.55,
  };
  const frac = startFraction[scenario] ?? 0;
  const startIdx = Math.min(Math.floor(n * frac), Math.max(0, n - 3));
  return playlists.slice(startIdx, startIdx + 3);
}

async function searchSpotifyPlaylists(
  query: string,
  accessToken: string,
  scenario: string,
): Promise<SpotifyPlaylistResult[]> {
  const q = encodeURIComponent(query);

  const [page1, page2] = await Promise.all([
    fetchPlaylistPage(q, 0, accessToken),
    fetchPlaylistPage(q, 10, accessToken),
  ]);

  const seenNames = new Set<string>();

  const candidates = [...page1, ...page2]
    .filter((item): item is RawPlaylist => item !== null)
    .filter(item => !isSpotifyOwned(item.owner))
    .filter(item => {
      const key = item.name.toLowerCase().trim();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

  return pickByScenario(candidates, scenario).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    external_urls: item.external_urls,
    images: item.images,
    tracks: item.tracks,
    owner: item.owner,
  }));
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function findPlaylistsFromVibe(
  answers: Record<string, string>,
  topData: TopData,
  accessToken: string,
): Promise<PlaylistSearchResult> {
  const searchQuery = await buildSearchQuery(answers, topData);
  const playlists = await searchSpotifyPlaylists(searchQuery, accessToken, answers.listening_scenario ?? 'hits');
  return { searchQuery, playlists };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaylistRecommendation(answers: Record<string, string>) {
  const { accessToken, ensureValidToken } = useSpotifyAuth();
  const { data: topData } = useSpotifyTopData();

  const enabled = !!accessToken && !!topData;

  return useQuery({
    queryKey: ['playlist-search', answers],
    queryFn: async () => {
      const freshToken = await ensureValidToken();
      if (!freshToken) throw new Error('Spotify session expired — please reconnect.');
      return findPlaylistsFromVibe(answers, topData!, freshToken);
    },
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
}

// ─── Clone pipeline (commented out — circle back later) ───────────────────────
//
// import { LOGO_COVER_JPEG_B64 } from './logoCoverBase64';
//
// async function fetchAllTrackUris(playlistId: string, accessToken: string): Promise<string[]> { ... }
// async function createNewPlaylist(userId: string, name: string, accessToken: string): Promise<string> { ... }
// async function addTracksToPlaylist(playlistId: string, uris: string[], accessToken: string): Promise<void> { ... }
// async function uploadPlaylistCover(playlistId: string, accessToken: string): Promise<void> { ... }
//
// Full clone implementation lives in git history. When ready:
//   1. Restore the clone functions above
//   2. Change queryKey to ['playlist-clone', answers]
//   3. Call findAndClonePlaylist(answers, topData!, freshToken, spotifyUserId!)
//   4. Add spotifyUserId to enabled check and useSpotifyAuth destructure
//   5. Update ResultsScreen to use ClonedResult instead of PlaylistSearchResult
