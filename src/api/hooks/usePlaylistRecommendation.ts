import { useQuery } from '@tanstack/react-query';

import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';
import { useSpotifyTopData, type TopData } from './useSpotifyTopData';
import { PLAYLIST_COVER_JPEG_BASE64 } from '@src/assets/playlistCover';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

// ─── Answer label maps ────────────────────────────────────────────────────────

const VIBE: Record<string, string> = {
  ready_to_disco: "ready to go, high energy, let's actually do this",
  half_asleep: 'barely functioning, needs something easy and low-demand',
  on_autopilot: 'on autopilot, just needs something on in the background',
  feeling_creative: 'brain is alive and active, feeling inspired',
  winding_down: 'coming in for a landing, slow and settling',
};
const MAINSTREAM: Record<string, string> = {
  hits: 'only chart-toppers and widely-known songs — artists with tens of millions of streams, songs everyone recognises',
  popular: 'well-known artists and songs but not just the obvious radio hits — go one layer below the surface',
  deep_cuts: 'prefer b-sides, album tracks, and artists with smaller but dedicated fanbases — avoid the obvious choices',
  obscure: 'seek out artists with under 500k monthly listeners, non-obvious deep cuts — nothing mainstream',
};
const ARTIST_WHY: Record<string, string> = {
  obsessed: 'just obsessed with this artist right now',
  vibes: "can't explain it, it just is",
  genre: "it's the genre — the whole sound feels right",
  lyrics: 'the lyrics — the words and voice matter right now',
};
const DISCOVERY: Record<string, string> = {
  safe: 'familiar territory only — no new artists',
  sprinkle: 'mostly familiar with a light sprinkle of new',
  half: 'half familiar, half new discoveries',
  deep: 'full send — take me somewhere completely new',
};
const VOCALS: Record<string, string> = {
  vocals: 'lyrics and vocals matter right now',
  instrumental: 'instrumental only — no vocals',
  either: 'no preference',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedSong {
  title: string;
  artist: string;
  uri: string | null;
}

export interface GeneratedPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: { spotify: string };
  images: { url: string }[];
  tracks: { total: number };
  songs: GeneratedSong[];
}

// ─── OpenAI — generate 25 songs ──────────────────────────────────────────────

function buildSongPrompt(answers: Record<string, string>, topData: TopData): string {
  const isCustomArtist = answers.artist_lane?.startsWith('custom:');
  const chosenArtist = isCustomArtist
    ? null
    : topData.artists.find(a => a.id === answers.artist_lane);
  const artistName = chosenArtist?.name ?? (isCustomArtist ? answers.artist_lane.slice(7) : null);
  const artistGenres = chosenArtist?.genres ?? [];

  const topArtistNames = topData.artists.slice(0, 8).map(a => a.name).join(', ');
  const recentTracks = topData.tracks
    .slice(0, 5)
    .map(t => `"${t.name}" by ${t.artists[0]?.name}`)
    .join(', ');

  const skipArtist = answers.skip_artist?.startsWith('custom:')
    ? answers.skip_artist.slice(7)
    : topData.artists.find(a => a.id === answers.skip_artist)?.name;

  return [
    `You are a music expert. Recommend exactly 25 real songs for this listener.`,
    ``,
    `LISTENER VIBE:`,
    `- Feeling right now: ${VIBE[answers.current_vibe] ?? answers.current_vibe}`,
    `- Song popularity preference: ${MAINSTREAM[answers.listening_scenario] ?? answers.listening_scenario}`,
    `- Artist they're feeling: ${artistName ?? 'unspecified'}`,
    artistGenres.length > 0 ? `- That artist's genres: ${artistGenres.join(', ')}` : '',
    `- Why that artist: ${ARTIST_WHY[answers.artist_why] ?? answers.artist_why}`,
    `- Vocals: ${VOCALS[answers.vocals] ?? 'no preference'}`,
    `- New music discovery: ${DISCOVERY[answers.discovery] ?? answers.discovery}`,
    skipArtist ? `- Skip this artist right now: ${skipArtist}` : '',
    ``,
    `THEIR MUSIC TASTE (for context — not a constraint):`,
    `- Listens to: ${topArtistNames || 'unknown'}`,
    `- Recent tracks: ${recentTracks || 'unknown'}`,
    ``,
    `RULES:`,
    `- Songs MUST match the chosen artist's genre. If they picked a country artist, give country songs.`,
    `- No more than 3 songs per artist`,
    `- Only recommend songs that actually exist and are on Spotify`,
    `- STRICTLY apply the song popularity preference: 'hits' = only chart-toppers with 50M+ streams; 'popular' = well-known but not the obvious single; 'deep_cuts' = album tracks and artists under 5M monthly listeners; 'obscure' = artists under 500k monthly listeners, nothing mainstream`,
    ``,
    `Return JSON:`,
    `{`,
    `  "playlist_name": "short punchy name (max 5 words, no quotes)",`,
    `  "playlist_description": "one sentence describing the vibe",`,
    `  "songs": [`,
    `    { "title": "exact song title", "artist": "exact artist name" }`,
    `  ]`,
    `}`,
  ].filter(Boolean).join('\n');
}

async function fetchSongRecommendations(
  prompt: string,
): Promise<{ playlist_name: string; playlist_description: string; songs: Array<{ title: string; artist: string }> }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as {
    playlist_name?: string;
    playlist_description?: string;
    songs?: Array<{ title: string; artist: string }>;
  };

  const songs = parsed.songs ?? [];

  return {
    playlist_name: parsed.playlist_name ?? 'My Vibe Playlist',
    playlist_description: parsed.playlist_description ?? '',
    songs,
  };
}

// ─── Spotify — search for track URIs ─────────────────────────────────────────

async function searchTrackUri(
  title: string,
  artist: string,
  accessToken: string,
): Promise<string | null> {
  const q = encodeURIComponent(`track:${title} artist:${artist}`);
  const url = `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.tracks?.items?.[0]?.uri ?? null;
}

// ─── Spotify — create playlist ────────────────────────────────────────────────

async function createSpotifyPlaylist(
  name: string,
  description: string,
  accessToken: string,
): Promise<string> {
  const res = await fetch(`https://api.spotify.com/v1/me/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description, public: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create playlist (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.id as string;
}

// ─── Spotify — add tracks ─────────────────────────────────────────────────────

async function addTracksToPlaylist(
  playlistId: string,
  uris: string[],
  accessToken: string,
): Promise<void> {
  // Spotify allows max 100 URIs per request
  const chunks: string[][] = [];
  for (let i = 0; i < uris.length; i += 100) chunks.push(uris.slice(i, i + 100));

  for (const chunk of chunks) {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris: chunk }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn(`[Spotify] add tracks error:`, body.slice(0, 200));
    }
  }
}

// ─── Spotify — upload playlist cover ─────────────────────────────────────────

async function uploadPlaylistCover(playlistId: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/images`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
    },
    body: PLAYLIST_COVER_JPEG_BASE64,
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn(`[Spotify] upload cover error:`, body.slice(0, 200));
  }
}

// ─── Spotify — fetch playlist details (cover image etc.) ─────────────────────

async function fetchPlaylistDetails(
  playlistId: string,
  accessToken: string,
): Promise<{ images: { url: string }[]; external_urls: { spotify: string } }> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return { images: [], external_urls: { spotify: `https://open.spotify.com/playlist/${playlistId}` } };
  const data = await res.json();
  return {
    images: data.images ?? [],
    external_urls: { spotify: data.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlistId}` },
  };
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function createPlaylistFromVibe(
  answers: Record<string, string>,
  topData: TopData,
  accessToken: string,
  spotifyUserId: string,
): Promise<GeneratedPlaylist> {
  // 1. Ask ChatGPT for 25 songs
  const prompt = buildSongPrompt(answers, topData);
  const { playlist_name, playlist_description, songs } = await fetchSongRecommendations(prompt);

  // 2. Search Spotify for each track URI (all in parallel)
  const uriResults = await Promise.all(
    songs.map(s => searchTrackUri(s.title, s.artist, accessToken)),
  );

  const foundUris = uriResults.filter((u): u is string => u !== null);
  const songsWithUris: GeneratedSong[] = songs.map((s, i) => ({
    title: s.title,
    artist: s.artist,
    uri: uriResults[i],
  }));

  // 3. Create the playlist
  const playlistId = await createSpotifyPlaylist(
    playlist_name,
    playlist_description,
    accessToken,
  );

  // 4. Add all found tracks
  if (foundUris.length > 0) {
    await addTracksToPlaylist(playlistId, foundUris, accessToken);
  }

  // 5. Upload the ez-pto logo as the playlist cover
  await uploadPlaylistCover(playlistId, accessToken);

  // 6. Fetch final playlist details (image, URL)
  const details = await fetchPlaylistDetails(playlistId, accessToken);

  return {
    id: playlistId,
    name: playlist_name,
    description: playlist_description,
    external_urls: details.external_urls,
    images: details.images,
    tracks: { total: foundUris.length },
    songs: songsWithUris,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaylistRecommendation(answers: Record<string, string>) {
  const { accessToken, spotifyUserId } = useSpotifyAuth();
  const { data: topData } = useSpotifyTopData();

  const enabled = !!accessToken && !!topData && !!spotifyUserId;

  return useQuery({
    queryKey: ['playlist-creation', answers],
    queryFn: () => createPlaylistFromVibe(answers, topData!, accessToken!, spotifyUserId!),
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
}
