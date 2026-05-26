import { useQuery } from '@tanstack/react-query';

import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { useSpotifyTopData, type TopData } from './useSpotifyTopData';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

// ─── Answer label maps ─────────────────────────────────────────────────────────

const VIBE: Record<string, string> = {
  tired: 'tired, needs something easy',
  hype: 'ready to rage, high energy',
  autopilot: 'on autopilot, background noise only',
  warming_up: 'warming up, first drink in',
  good_mood: 'good mood for no particular reason',
};
const DISCOVERY: Record<string, string> = {
  classics: 'familiar classics only',
  familiar_fresh: 'similar to what they know but never heard it',
  explore: 'wants to be surprised, somewhere completely new',
  deep_cuts: 'deep cuts and forgotten songs',
};
const LOCATION: Record<string, string> = {
  home_dark: 'in their room, lights low',
  moving: 'out and moving — commute, walk, or gym',
  desk: 'at their desk trying to be productive',
  social: 'around people, semi-social',
};
const ATTENTION: Record<string, string> = {
  full: 'full attention — music is the main activity',
  half: 'half in — background but still tracking it',
  background: 'barely listening, just needs something on',
  variable: 'will zone in and out',
};
const EFFECT: Record<string, string> = {
  match: "match the current mood, don't challenge it",
  escape: 'pull them out of their head',
  energise: "give them energy they don't currently have",
  feel: "make them feel something they've been avoiding",
};
const DAY: Record<string, string> = {
  busy: 'busy, needs to stay locked in',
  free: 'free — nowhere to be',
  social: 'social later — people at some point',
  unknown: 'unknown, could go either way',
};
const PLAYBACK: Record<string, string> = {
  shuffle: 'shuffle everything, chaos is fine',
  radio: 'artist radio — one artist and let it ride',
  curated: 'trust a human curator',
  repeat: 'one song on repeat until done',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks?: { total: number };
  external_urls: { spotify: string };
  owner: { display_name: string };
}

// ─── Claude prompt ────────────────────────────────────────────────────────────

function buildPrompt(answers: Record<string, string>, topData: TopData): string {
  const topArtists = topData.artists.slice(0, 8).map(a => a.name).join(', ');
  const topGenres = [...new Set(topData.artists.flatMap(a => a.genres))].slice(0, 6).join(', ');
  const topTracks = topData.tracks.slice(0, 5).map(t => `${t.name} by ${t.artists[0]?.name}`).join(', ');

  const chosenArtist = topData.artists.find(a => a.id === answers.artist_lane);
  const chosenTrack = topData.tracks.find(t => t.id === answers.seed_track);
  const skipArtist = topData.artists.find(a => a.id === answers.skip_artist);

  const lines = [
    `You're a music expert helping find the perfect real Spotify playlist for right now.`,
    ``,
    `User's Spotify profile:`,
    `- Top artists: ${topArtists || 'unknown'}`,
    `- Top genres: ${topGenres || 'unknown'}`,
    `- Tracks they love right now: ${topTracks || 'unknown'}`,
    ``,
    `Their current situation:`,
    `- Vibe: ${VIBE[answers.current_vibe] ?? answers.current_vibe}`,
    `- Discovery appetite: ${DISCOVERY[answers.discovery] ?? answers.discovery}`,
    `- Location: ${LOCATION[answers.location] ?? answers.location}`,
    `- Music attention: ${ATTENTION[answers.attention] ?? answers.attention}`,
    `- Want music to: ${EFFECT[answers.desired_effect] ?? answers.desired_effect}`,
    `- Rest of day: ${DAY[answers.day_context] ?? answers.day_context}`,
    `- Playback style: ${PLAYBACK[answers.playback_style] ?? answers.playback_style}`,
    chosenArtist ? `- Artist calling to them right now: ${chosenArtist.name}` : '',
    chosenTrack ? `- Would tap play on immediately: ${chosenTrack.name}` : '',
    skipArtist ? `- Would skip right now even though they love them: ${skipArtist.name}` : '',
    ``,
    `Give me exactly 3 Spotify playlist search queries that would find real, existing playlists perfect for this exact moment. Be specific — include mood, genre, and context so the search returns relevant results. Return a JSON object with a single key "queries" containing an array of 3 strings.`,
  ].filter(l => l !== undefined);

  return lines.join('\n');
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchOpenAIQueries(prompt: string): Promise<string[]> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as { queries?: string[] };
  if (!Array.isArray(parsed.queries) || parsed.queries.length === 0) {
    throw new Error('OpenAI returned unexpected format');
  }
  return parsed.queries;
}

async function searchSpotifyPlaylist(query: string, accessToken: string): Promise<SpotifyPlaylist | null> {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=5&market=from_token`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;

  const data = await res.json();
  const items: SpotifyPlaylist[] = (data.playlists?.items ?? []).filter(Boolean);

  // Prefer official Spotify playlists, fall back to first result
  return items.find(p => p.owner?.display_name === 'Spotify') ?? items[0] ?? null;
}

async function fetchRecommendedPlaylists(
  answers: Record<string, string>,
  topData: TopData,
  accessToken: string,
): Promise<SpotifyPlaylist[]> {
  const prompt = buildPrompt(answers, topData);
  const queries = await fetchOpenAIQueries(prompt);

  const results = await Promise.all(queries.map(q => searchSpotifyPlaylist(q, accessToken)));

  // Deduplicate by id and filter nulls
  const seen = new Set<string>();
  return results.filter((p): p is SpotifyPlaylist => {
    if (!p || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaylistRecommendation(answers: Record<string, string>) {
  const { accessToken } = useSpotifyAuth();
  const { data: topData } = useSpotifyTopData();

  return useQuery({
    queryKey: ['playlist-recommendation', answers],
    queryFn: () => fetchRecommendedPlaylists(answers, topData!, accessToken!),
    enabled: !!accessToken && !!topData,
    staleTime: Infinity,
    retry: 1,
  });
}
