import { useQuery } from '@tanstack/react-query';
import { useSpotifyAuth } from '@src/state/spotify/SpotifyAuthProvider';

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
}

export interface TopData {
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
}

// ─── Demo mode mock data ──────────────────────────────────────────────────────

const DEMO_TOP_DATA: TopData = {
  artists: [
    { id: 'demo_1',  name: 'Nova Eclipse',      genres: ['indie electronic', 'synth-pop', 'indie pop'] },
    { id: 'demo_2',  name: 'The Dusty Roads',   genres: ['indie rock', 'alternative', 'post-punk'] },
    { id: 'demo_3',  name: 'Marisol',           genres: ['r&b', 'soul', 'neo soul'] },
    { id: 'demo_4',  name: 'Vertigo Blue',      genres: ['psychedelic', 'lo-fi', 'dream pop'] },
    { id: 'demo_5',  name: 'Jay Calloway',      genres: ['hip hop', 'hip-hop', 'rap', 'trap'] },
    { id: 'demo_6',  name: 'The Coral Cove',    genres: ['indie pop', 'bedroom pop', 'chillwave'] },
    { id: 'demo_7',  name: 'Solène',            genres: ['pop', 'dance pop', 'electropop'] },
    { id: 'demo_8',  name: 'Rivers & Rust',     genres: ['country', 'folk', 'americana', 'singer-songwriter'] },
    { id: 'demo_9',  name: 'Echo Chamber',      genres: ['electronic', 'ambient', 'synth', 'experimental'] },
    { id: 'demo_10', name: 'Velvet Theory',     genres: ['r&b', 'alternative r&b', 'neo soul'] },
    { id: 'demo_11', name: 'Casa Mañana',       genres: ['latin', 'reggaeton', 'pop'] },
    { id: 'demo_12', name: 'Breakwater',        genres: ['rock', 'alternative', 'indie rock'] },
    { id: 'demo_13', name: 'Glasswork',         genres: ['indie', 'bedroom pop', 'lo-fi'] },
    { id: 'demo_14', name: 'The Static Shore',  genres: ['emo', 'punk', 'hardcore'] },
    { id: 'demo_15', name: 'Midnight Bureau',   genres: ['jazz', 'blues', 'soul'] },
  ],
  tracks: [
    { id: 'dt1', name: 'Golden Hour',      artists: [{ id: 'demo_1',  name: 'Nova Eclipse' }] },
    { id: 'dt2', name: 'Out of Reach',     artists: [{ id: 'demo_2',  name: 'The Dusty Roads' }] },
    { id: 'dt3', name: 'Midnight Swim',    artists: [{ id: 'demo_3',  name: 'Marisol' }] },
    { id: 'dt4', name: 'Signal & Noise',   artists: [{ id: 'demo_9',  name: 'Echo Chamber' }] },
    { id: 'dt5', name: 'Slow Burn',        artists: [{ id: 'demo_10', name: 'Velvet Theory' }] },
  ],
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchTopData(accessToken: string): Promise<TopData> {
  if (accessToken === '__demo__') return DEMO_TOP_DATA;
  const [artistsRes, tracksRes] = await Promise.all([
    fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  if (artistsRes.status === 401 || tracksRes.status === 401) {
    throw new Error('spotify_unauthorized');
  }
  if (!artistsRes.ok || !tracksRes.ok) {
    throw new Error('Failed to fetch Spotify data');
  }

  const [artistsData, tracksData] = await Promise.all([
    artistsRes.json(),
    tracksRes.json(),
  ]);

  return {
    artists: (artistsData.items ?? []).map((a: SpotifyArtist) => ({ ...a, genres: a.genres ?? [] })),
    tracks: tracksData.items ?? [],
  };
}

export function useSpotifyTopData() {
  const { accessToken } = useSpotifyAuth();
  const { data, status } = useQuery({
    queryKey: ['spotify-top-data'],
    queryFn: () => fetchTopData(accessToken!),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
  return { data, isLoading: status === 'pending', status };
}
