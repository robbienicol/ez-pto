import { useQuery } from '@tanstack/react-query';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const SERPER_KEY = process.env.EXPO_PUBLIC_SERPER_API_KEY ?? '';

// ─── Direction maps (current quiz fields) ─────────────────────────────────────

const ASPIRATION_MUSIC: Record<string, string> = {
  aspire_social:   'party anthems / feel-good / social bangers',
  aspire_grind:    'intense / focused / trap / drill / motivational',
  aspire_creative: 'artistic / experimental / left-field / avant-garde',
  aspire_chill:    'smooth / soul / lo-fi / laid-back / mellow',
  aspire_explorer: 'genre-crossing / discovery / eclectic',
};

const ERA_DIRECTION: Record<string, string> = {
  era_70s:   '1970s soul funk rock',
  era_90s:   '1990s grunge hip-hop alternative',
  era_2000s: '2000s pop hip-hop indie blog era',
  era_2010s: '2010s lo-fi indie blog era dream pop',
  era_now:   '2020s current',
};

const CURRENT_MUSIC_DIRECTION: Record<string, string> = {
  music_rap:      'rap / hip-hop',
  music_pop:      'pop / mainstream',
  music_rock:     'rock / alternative',
  music_rnb:      'r&b / soul',
  music_eclectic: 'eclectic / mixed genres',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlaylistResult {
  id: string;
  name: string;
  description: string;
  url: string;
  platform: 'spotify' | 'apple' | 'youtube';
  thumbnailUrl: string | null;
}

export interface PlaylistSearchResult {
  searchQuery: string;
  playlists: PlaylistResult[];
}

type Platform = 'spotify' | 'apple' | 'youtube';

function resolvePlatform(answers: Record<string, string>): Platform {
  if (answers.platform === 'platform_apple') return 'apple';
  if (answers.platform === 'platform_youtube') return 'youtube';
  return 'spotify';
}

// ─── Build target direction from answers ──────────────────────────────────────

function buildDirection(answers: Record<string, string>): string {
  const parts: string[] = [];

  const artist = answers.artist_lane?.startsWith('custom:') ? answers.artist_lane.slice(7) : null;
  if (artist) parts.push(`Artist: ${artist}`);

  const aspiration = answers.aspiration ? ASPIRATION_MUSIC[answers.aspiration] : null;
  if (aspiration) parts.push(`Aspiration: ${aspiration}`);

  const era = answers.era_resonance ? ERA_DIRECTION[answers.era_resonance] : null;
  if (era) parts.push(`Era: ${era}`);

  const currentGenre = answers.current_music ? CURRENT_MUSIC_DIRECTION[answers.current_music] : null;
  if (currentGenre) parts.push(`Current genre (steer away from this): ${currentGenre}`);

  const location = answers.location?.startsWith('custom:') ? answers.location.slice(7) : null;
  if (location) parts.push(`Location: ${location}`);

  return parts.join('\n');
}

// ─── GPT: generate playlist search query ─────────────────────────────────────

async function buildSearchQuery(direction: string, platform: Platform): Promise<string> {
  const platformNote = platform === 'apple'
    ? 'The query will search Apple Music playlists.'
    : platform === 'youtube'
    ? 'The query will search YouTube playlists.'
    : 'The query will search Spotify playlists.';

  const prompt = `You are a music curator. Based on this listener's profile, generate a 3-6 word playlist search query that will find playlists matching WHERE THEY SHOULD BE going — not where they currently are.

${direction}

${platformNote}

The query should sound like a real playlist title a human curator would write.
Never use: "chill", "vibes", "relaxing", "good music", "playlist".
Lean into genre, scene, era, or mood — be specific.

Return JSON: { "query": "your search query here" }`;

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

  if (!res.ok) throw new Error(`OpenAI query build failed (${res.status})`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as { query?: string };
  return parsed.query ?? 'underground discovery playlist';
}

// ─── Blog search: find artists in the target direction ───────────────────────

const BLOG_SITES =
  'site:pitchfork.com OR site:gorillavsbear.net OR site:thefader.com OR site:stereogum.com OR site:tinymixtapes.com OR site:exclaim.ca OR site:nme.com';

interface SerperOrganic {
  link: string;
  title: string;
  snippet?: string;
}

async function findBlogArtists(direction: string, count = 3): Promise<string[]> {
  try {
    const era = direction.split('\n').find(l => l.startsWith('Era:'))?.replace('Era:', '').trim() ?? '';
    const aspiration = direction.split('\n').find(l => l.startsWith('Aspiration:'))?.replace('Aspiration:', '').trim() ?? '';
    const location = direction.split('\n').find(l => l.startsWith('Location:'))?.replace('Location:', '').trim() ?? '';

    const searchTerm = [location, aspiration, era, 'artists to listen to'].filter(Boolean).join(' ');

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `${searchTerm} ${BLOG_SITES}`, num: 8 }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const snippets = ((data.organic ?? []) as SerperOrganic[])
      .map(r => `${r.title}: ${r.snippet ?? ''}`)
      .join('\n')
      .slice(0, 2000);

    if (!snippets) return [];

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Music blog results:\n\n${snippets}\n\nThis listener's target direction:\n${aspiration} ${era}${location ? ` — based in ${location}` : ''}\n\nExtract ${count} specific artist names from these snippets that fit this direction. Prefer artists relevant to their location if mentioned. Real artists only. Return JSON: { "artists": ["Artist 1", "Artist 2", "Artist 3"] }`,
        }],
        response_format: { type: 'json_object' },
        max_tokens: 80,
        temperature: 0.3,
      }),
    });

    if (!gptRes.ok) return [];
    const gptData = await gptRes.json();
    const parsed = JSON.parse(gptData.choices?.[0]?.message?.content ?? '{}') as { artists?: string[] };
    return Array.isArray(parsed.artists) ? parsed.artists.slice(0, count) : [];
  } catch {
    return [];
  }
}

// ─── Platform-aware playlist search ──────────────────────────────────────────

const PLATFORM_SITE: Record<Platform, string> = {
  spotify: 'site:open.spotify.com/playlist',
  apple:   'site:music.apple.com/playlist OR site:music.apple.com/us/playlist',
  youtube: 'site:youtube.com/playlist',
};

interface RawPlaylist { id: string; name: string; description: string; url: string; platform: Platform }

async function searchPlaylists(query: string, platform: Platform, num = 10): Promise<RawPlaylist[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `${PLATFORM_SITE[platform]} ${query}`, num }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const seen = new Set<string>();

  return ((data.organic ?? []) as SerperOrganic[])
    .map((r): RawPlaylist | null => {
      let id: string;
      let url: string;

      if (platform === 'spotify') {
        const match = r.link.match(/playlist\/([A-Za-z0-9]+)/);
        if (!match) return null;
        id = match[1];
        url = `https://open.spotify.com/playlist/${id}`;
      } else if (platform === 'apple') {
        id = r.link.match(/pl\.[A-Za-z0-9]+/)?.[0] ?? r.link;
        url = r.link;
      } else {
        id = r.link.match(/[?&]list=([A-Za-z0-9_-]+)/)?.[1] ?? r.link;
        url = r.link;
      }

      if (seen.has(id)) return null;
      seen.add(id);

      return {
        id,
        name: r.title.split(' • ')[0]?.trim() ?? r.title,
        description: r.snippet ?? '',
        url,
        platform,
      };
    })
    .filter((x): x is RawPlaylist => x !== null)
    .filter(x => {
      const text = `${x.name} ${x.description}`.toLowerCase();
      return !/(podcast|episode|interview|show notes|hosted by|listen now|guest:|chapter \d)/i.test(text);
    });
}

// ─── Thumbnail fetch ──────────────────────────────────────────────────────────

async function fetchThumbnail(p: RawPlaylist): Promise<string | null> {
  try {
    let oembedUrl: string;
    if (p.platform === 'spotify') {
      oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(p.url)}`;
    } else if (p.platform === 'youtube') {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(p.url)}&format=json`;
    } else {
      return null;
    }
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.thumbnail_url as string | undefined) ?? null;
  } catch {
    return null;
  }
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function findPlaylists(answers: Record<string, string>): Promise<PlaylistSearchResult> {
  const platform = resolvePlatform(answers);
  const direction = buildDirection(answers);


  // Run blog artist search + query build in parallel
  const [blogArtists, searchQuery] = await Promise.all([
    findBlogArtists(direction, 3),
    buildSearchQuery(direction, platform),
  ]);


  // Search playlists: one per blog artist + one from the main query
  const inputArtist = answers.artist_lane?.startsWith('custom:') ? answers.artist_lane.slice(7) : null;
  const artistsToSearch = [...new Set([...blogArtists, inputArtist].filter(Boolean))] as string[];

  const [queryResults, ...artistResults] = await Promise.all([
    searchPlaylists(searchQuery, platform, 6),
    ...artistsToSearch.slice(0, 3).map(a => searchPlaylists(`"${a}"`, platform, 4)),
  ]);

  // Merge: prioritise blog-found artist playlists, fill with query results
  const seen = new Set<string>();
  const merged: RawPlaylist[] = [];

  for (const list of [...artistResults, [queryResults[0], queryResults[1]].filter(Boolean) as RawPlaylist[]]) {
    for (const p of list) {
      if (!seen.has(p.id) && merged.length < 3) {
        seen.add(p.id);
        merged.push(p);
      }
    }
  }

  // Fallback: fill from query results if we didn't get 3
  for (const p of queryResults) {
    if (!seen.has(p.id) && merged.length < 3) {
      seen.add(p.id);
      merged.push(p);
    }
  }

  const thumbnails = await Promise.all(merged.map(p => fetchThumbnail(p)));

  return {
    searchQuery,
    playlists: merged.map((p, i) => ({ ...p, thumbnailUrl: thumbnails[i] ?? null })),
  };
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

const DEMO_RESULT: PlaylistSearchResult = {
  searchQuery: 'underground indie discovery',
  playlists: [
    { id: 'demo_p1', name: 'late night frequencies', description: 'electronic and indie for the hours when everything slows down', url: 'https://open.spotify.com/genre/indie-page', platform: 'spotify', thumbnailUrl: null },
    { id: 'demo_p2', name: 'bedroom pop essentials', description: 'intimate, lo-fi, and just a little hazy', url: 'https://open.spotify.com/genre/lofi-page', platform: 'spotify', thumbnailUrl: null },
    { id: 'demo_p3', name: 'underground sounds', description: 'hidden gems from the edges of indie and electronic', url: 'https://open.spotify.com/genre/electronic-page', platform: 'spotify', thumbnailUrl: null },
  ],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaylistRecommendation(answers: Record<string, string>) {
  const isDemo = answers._demo === 'true';

  return useQuery({
    queryKey: ['playlist-search', answers],
    queryFn: () => {
      if (isDemo) return DEMO_RESULT;
      return findPlaylists(answers);
    },
    enabled: Object.keys(answers).length > 0,
    staleTime: Infinity,
    retry: 1,
  });
}
