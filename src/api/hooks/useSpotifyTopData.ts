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

async function fetchTopData(accessToken: string): Promise<TopData> {
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
