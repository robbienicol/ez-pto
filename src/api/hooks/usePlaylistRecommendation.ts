import { useQuery } from '@tanstack/react-query';

import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { useSpotifyTopData, type TopData } from './useSpotifyTopData';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

// ─── Answer label maps ────────────────────────────────────────────────────────

const VIBE: Record<string, string> = {
  ready_to_disco: 'high energy, ready to go',
  half_asleep: 'low energy, barely functioning',
  on_autopilot: 'background listening, chill',
  road_soda: 'driving, on the move',
  winding_down: 'calm and winding down',
};

// Energy constraints injected into the has-artist prompt to prevent mismatched results
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

// ─── Spotify — related artists ────────────────────────────────────────────────

interface RelatedArtist {
  name: string;
  genres: string[];
}

async function fetchRelatedArtists(artistId: string, accessToken: string): Promise<RelatedArtist[]> {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.artists ?? []) as RelatedArtist[]).slice(0, 4).map(a => ({
    name: a.name,
    genres: a.genres ?? [],
  }));
}

// ─── OpenAI — generate search query ──────────────────────────────────────────

async function buildSearchQuery(
  answers: Record<string, string>,
  topData: TopData,
  relatedArtists: RelatedArtist[],
): Promise<string> {
  const isCustomArtist = answers.artist_lane?.startsWith('custom:');
  const chosenArtist = isCustomArtist
    ? null
    : topData.artists.find(a => a.id === answers.artist_lane);
  const artistName = chosenArtist?.name ?? (isCustomArtist ? answers.artist_lane.slice(7) : null);
  const artistGenres = chosenArtist?.genres ?? [];
  const hasArtist = !!artistName;

  const relatedNames = relatedArtists.map(a => a.name);
  const relatedGenres = [...new Set(relatedArtists.flatMap(a => a.genres))].slice(0, 6);
  const genreCluster = [...new Set([...artistGenres, ...relatedGenres])].slice(0, 6);

  const aspect = !isCustomArtist && answers.artist_aspect?.startsWith('aspect:') && answers.artist_aspect !== 'aspect:all'
    ? answers.artist_aspect.slice(7)
    : null;

  const eraText = answers.era ? ERA[answers.era] ?? answers.era : null;

  let prompt: string;

  if (hasArtist) {
    prompt = [
      `Generate a 3-6 word Spotify playlist search query to find playlists where ${artistName} would be curated alongside similar artists.`,
      ``,
      `Think: what would a human curator write as the name or description of a playlist that includes ${artistName}?`,
      ``,
      `Artist: ${artistName}`,
      genreCluster.length > 0 ? `Genre cluster: ${genreCluster.join(', ')}` : null,
      relatedNames.length > 0 ? `Similar artists: ${relatedNames.join(', ')}` : null,
      aspect ? `The listener specifically connects with: ${aspect} — weight this heavily in the query` : null,
      eraText ? `Era: ${eraText}` : null,
      VIBE_ENERGY[answers.current_vibe] ? `Energy constraint: ${VIBE_ENERGY[answers.current_vibe]}` : null,
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

const MAX_SAVES = 4000;

async function fetchFollowerCount(playlistId: string, accessToken: string): Promise<number> {
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=followers`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return Infinity;
  const data = await res.json();
  return (data.followers?.total as number | undefined) ?? Infinity;
}

type RawPlaylistWithFollowers = RawPlaylist & { followerCount: number };

// Map listening_scenario to a fractional start position within the result pool.
// obscure gets the bottom of the list, hits the top, others scale linearly between.
function pickByScenario(playlists: RawPlaylistWithFollowers[], scenario: string): RawPlaylistWithFollowers[] {
  const m = playlists.length;
  if (m === 0) return [];

  if (scenario === 'obscure' || scenario === 'discovery') {
    return [...playlists].slice(Math.max(0, m - 3)).reverse();
  }

  const startFraction: Record<string, number> = {
    hits:      0,
    singalong: 0,
    popular:   0.25,
    nostalgic: 0.25,
  };
  const frac = startFraction[scenario] ?? 0;
  const startIdx = Math.min(Math.floor(m * frac), Math.max(0, m - 3));
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

  const followerCounts = await Promise.all(
    candidates.map(p => fetchFollowerCount(p.id, accessToken)),
  );

  const withFollowers: RawPlaylistWithFollowers[] = candidates.map((p, i) => ({
    ...p,
    followerCount: followerCounts[i]!,
  }));

  // Keep only hidden gems; if none qualify, fall back to the least-saved ones
  const gems = withFollowers.filter(p => p.followerCount < MAX_SAVES);
  const pool = gems.length > 0
    ? gems
    : [...withFollowers].sort((a, b) => a.followerCount - b.followerCount).slice(0, 5);

  return pickByScenario(pool, scenario).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    external_urls: item.external_urls,
    images: item.images,
    tracks: item.tracks,
    owner: item.owner,
  }));
}

// ─── Demo mode mock playlists ─────────────────────────────────────────────────

const DEMO_PLAYLIST_RESULT: PlaylistSearchResult = {
  searchQuery: 'indie electronic dream pop',
  playlists: [
    {
      id: 'demo_p1',
      name: 'late night frequencies',
      description: 'electronic and indie for the hours when everything slows down',
      external_urls: { spotify: 'https://open.spotify.com/genre/indie-page' },
      images: [],
      tracks: { total: 42 },
      owner: { display_name: 'indiecurator', id: 'indiecurator' },
    },
    {
      id: 'demo_p2',
      name: 'bedroom pop essentials',
      description: 'intimate, lo-fi, and just a little hazy',
      external_urls: { spotify: 'https://open.spotify.com/genre/lofi-page' },
      images: [],
      tracks: { total: 38 },
      owner: { display_name: 'vibesonly', id: 'vibesonly' },
    },
    {
      id: 'demo_p3',
      name: 'underground sounds',
      description: 'hidden gems from the edges of indie and electronic',
      external_urls: { spotify: 'https://open.spotify.com/genre/electronic-page' },
      images: [],
      tracks: { total: 55 },
      owner: { display_name: 'discoverymode', id: 'discoverymode' },
    },
  ],
};

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function findPlaylistsFromVibe(
  answers: Record<string, string>,
  topData: TopData,
  accessToken: string,
): Promise<PlaylistSearchResult> {
  const isCustomArtist = answers.artist_lane?.startsWith('custom:');
  const chosenArtist = isCustomArtist
    ? null
    : topData.artists.find(a => a.id === answers.artist_lane);

  const relatedArtists = chosenArtist
    ? await fetchRelatedArtists(chosenArtist.id, accessToken)
    : [];

  const searchQuery = await buildSearchQuery(answers, topData, relatedArtists);
  console.log('[playlist] answers:', JSON.stringify(answers, null, 2));
  console.log('[playlist] query:', searchQuery);
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
      if (accessToken === '__demo__') return DEMO_PLAYLIST_RESULT;
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
