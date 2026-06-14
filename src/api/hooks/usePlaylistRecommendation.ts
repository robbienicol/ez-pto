import { useQuery } from '@tanstack/react-query';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const SERPER_KEY = process.env.EXPO_PUBLIC_SERPER_API_KEY ?? '';

// ─── Answer label maps (current quiz fields) ──────────────────────────────────

const ERA_MAP: Record<string, string> = {
  era_70s:   'pre-1990s, vintage, classic era',
  era_90s:   '1990s and early 2000s',
  era_2000s: '2000s',
  era_2010s: '2010s',
  era_now:   'current 2020s, recent releases',
};

const SETTING_ENERGY: Record<string, string> = {
  setting_gym:    'high energy, workout context — playlist MUST feel energetic and hard-hitting, nothing slow',
  setting_drive:  'car/driving context — needs good forward momentum, works as a driving playlist',
  setting_solo:   'calm and introspective — late night, atmospheric, winding down',
};

const GENRE_LABEL: Record<string, string> = {
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

const PLATFORM_SUFFIX: Record<Platform, string> = {
  spotify: 'spotify playlist',
  apple:   'apple music playlist',
  youtube: 'youtube playlist',
};

const PLATFORM_LABEL: Record<Platform, string> = {
  spotify: 'Spotify',
  apple:   'Apple Music',
  youtube: 'YouTube',
};

// ─── OpenAI — generate search query ──────────────────────────────────────────

async function buildSearchQuery(
  answers: Record<string, string>,
  platform: Platform,
): Promise<string> {
  const artistName = answers.artist_lane?.startsWith('custom:') ? answers.artist_lane.slice(7) : null;
  const hasArtist = !!artistName;
  const subGenre = answers.genre_resonance ?? null;
  const inferredGenre = answers.inferred_genre ?? (answers.current_music ? GENRE_LABEL[answers.current_music] : null);
  const eraText = answers.era_resonance ? ERA_MAP[answers.era_resonance] : null;
  const energyConstraint = answers.social_energy ? SETTING_ENERGY[answers.social_energy] : null;
  const location = answers.location?.startsWith('custom:') ? answers.location.slice(7) : null;
  const platformLabel = PLATFORM_LABEL[platform];

  let prompt: string;

  if (hasArtist) {
    prompt = [
      `Generate a 3-6 word ${platformLabel} playlist search query to find playlists where ${artistName} would be curated alongside similar artists.`,
      ``,
      `Think: what would a human curator write as the name of a playlist that includes ${artistName}?`,
      ``,
      `Artist: ${artistName}`,
      subGenre
        ? `Sub-genre the listener specifically connects with: ${subGenre} — reflect this in the query`
        : inferredGenre
          ? `Artist's primary genre: ${inferredGenre} — anchor the query to this genre`
          : null,
      eraText ? `Era preference: ${eraText}` : null,
      energyConstraint ? `Energy constraint: ${energyConstraint}` : null,
      location ? `Listener is based in ${location} — factor in regional scenes if relevant` : null,
      ``,
      `Return JSON: { "query": "your search query here" }`,
      `The query must sound like a real human-curated playlist title — NOT an algorithmic Spotify feature.`,
      `Never use: "chill", "vibes", "relaxing", "good music", "playlist", "radio", "mix".`,
      `Examples: "dreamy psych pop gems", "weirdo girl indie", "underground psych garage", "lo-fi bedroom discoveries"`,
      `Keep it 3-6 words. Think curator on RateYourMusic, not Spotify algorithm.`,
    ].filter(Boolean).join('\n');
  } else {
    const genreContext = subGenre ?? inferredGenre ?? null;
    prompt = [
      `Generate a concise ${platformLabel} playlist search query (3-6 words) based on this listener's profile.`,
      ``,
      genreContext ? `Genre: ${genreContext}` : null,
      eraText ? `Era: ${eraText}` : null,
      energyConstraint ? `Energy: ${energyConstraint}` : null,
      location ? `Location: ${location}` : null,
      ``,
      `Return JSON: { "query": "your search query here" }`,
      `Examples: "90s hip-hop classics", "late night r&b instrumental", "soft indie acoustic"`,
      `Keep it 3-6 words.`,
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

  if (!res.ok) throw new Error(`OpenAI failed (${res.status})`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}') as { query?: string };
  return parsed.query ?? `${inferredGenre ?? 'indie'} essentials`;
}

// ─── Platform-aware playlist search ──────────────────────────────────────────

interface SerperOrganic { link: string; title: string; snippet?: string }
interface RawPlaylist { id: string; name: string; description: string; url: string; platform: Platform }

const BAD_PLAYLIST = /(podcast|episode|\bradio\b|daily mix|discover weekly|release radar|on repeat|spotify news|your top songs|this is [a-zA-Z]|essentials$|greatest hits|best of \w|the very best|\bmix\b)/i;

async function searchWebForPlaylists(query: string, platform: Platform, num = 10): Promise<RawPlaylist[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `${query} ${PLATFORM_SUFFIX[platform]}`, num }),
  });

  if (!res.ok) {
    console.warn('[playlist] serper error', res.status, await res.text().catch(() => ''));
    return [];
  }

  const data = await res.json();
  console.log('[playlist] serper raw organic count:', (data.organic ?? []).length, 'for query:', query);
  const seen = new Set<string>();

  return ((data.organic ?? []) as SerperOrganic[])
    .map((r): RawPlaylist | null => {
      let id: string; let url: string;
      if (platform === 'spotify') {
        const m = r.link.match(/playlist\/([A-Za-z0-9]+)/);
        if (!m) return null;
        id = m[1]; url = `https://open.spotify.com/playlist/${id}`;
      } else if (platform === 'apple') {
        id = r.link.match(/pl\.[A-Za-z0-9]+/)?.[0] ?? r.link; url = r.link;
      } else {
        id = r.link.match(/[?&]list=([A-Za-z0-9_-]+)/)?.[1] ?? r.link; url = r.link;
      }
      if (seen.has(id)) return null;
      seen.add(id);
      return { id, name: r.title.split(' • ')[0]?.trim() ?? r.title, description: r.snippet ?? '', url, platform };
    })
    .filter((x): x is RawPlaylist => x !== null)
    .filter(x => !BAD_PLAYLIST.test(`${x.name} ${x.description}`));
}

// ─── Blog search — find a discovery artist similar to what they like ──────────

const BLOG_SITES =
  'site:gorillavsbear.net OR site:stereogum.com OR site:thefader.com OR site:tinymixtapes.com OR site:pitchfork.com OR site:numerogroup.com OR site:aquariusrecords.org';

async function searchBlogForArtist(answers: Record<string, string>): Promise<string | null> {
  try {
    const artist = answers.artist_lane?.startsWith('custom:') ? answers.artist_lane.slice(7) : null;
    const genre = answers.genre_resonance ?? (answers.current_music ? GENRE_LABEL[answers.current_music] : null);
    const eraText = answers.era_resonance ? ERA_MAP[answers.era_resonance] : null;
    const focus = artist ?? genre ?? null;
    if (!focus) return null;

    const q = [focus, eraText, 'recommendation'].filter(Boolean).join(' ');
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `${q} ${BLOG_SITES}`, num: 5 }),
    });

    if (!res.ok) return null;
    const organic = ((await res.json()).organic ?? []) as SerperOrganic[];
    if (!organic.length) return null;

    const context = organic.map(r => `${r.title}: ${r.snippet ?? ''}`).join('\n').slice(0, 1200);

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Music blog snippets for someone who likes ${focus}:\n\n${context}\n\nExtract ONE specific underrated or emerging artist that would be a great discovery for this listener. Do not suggest ${focus} itself.\nReturn JSON: { "artist": "Artist Name" } or { "artist": null } if nothing fits.`,
        }],
        response_format: { type: 'json_object' },
        max_tokens: 60,
        temperature: 0.3,
      }),
    });

    if (!gptRes.ok) return null;
    const parsed = JSON.parse((await gptRes.json()).choices?.[0]?.message?.content ?? '{}') as { artist?: string | null };
    return parsed.artist ?? null;
  } catch { return null; }
}


// ─── Thumbnail fetch ──────────────────────────────────────────────────────────

async function fetchThumbnail(p: RawPlaylist): Promise<{ thumbnail: string | null; title: string | null }> {
  try {
    const url = p.platform === 'spotify'
      ? `https://open.spotify.com/oembed?url=${encodeURIComponent(p.url)}`
      : p.platform === 'youtube'
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(p.url)}&format=json`
      : null;
    if (!url) return { thumbnail: null, title: null };
    const res = await fetch(url);
    if (!res.ok) return { thumbnail: null, title: null };
    const data = await res.json();
    return {
      thumbnail: (data.thumbnail_url as string | undefined) ?? null,
      title:     (data.title as string | undefined) ?? null,
    };
  } catch { return { thumbnail: null, title: null }; }
}

// ─── Scenario-based selection ─────────────────────────────────────────────────

function pickByScenario(candidates: RawPlaylist[], wantDiscovery: boolean): RawPlaylist[] {
  const m = candidates.length;
  if (m === 0) return [];
  if (wantDiscovery) return candidates.slice(Math.max(0, m - 3)).reverse();
  return candidates.slice(0, 3);
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function findPlaylists(answers: Record<string, string>): Promise<PlaylistSearchResult> {
  const platform = resolvePlatform(answers);
  const artistName = answers.artist_lane?.startsWith('custom:') ? answers.artist_lane.slice(7) : null;
  const wantDiscovery = answers.missing_quality === 'want_deep';
  const eraText = answers.era_resonance ? ERA_MAP[answers.era_resonance] ?? '' : '';

  console.log('[playlist] keys present — openai:', !!OPENAI_KEY, 'serper:', !!SERPER_KEY);
  console.log('[playlist] answers:', JSON.stringify(answers));
  console.log('[playlist] platform:', platform, '| wantDiscovery:', wantDiscovery);

  const searchQuery = await buildSearchQuery(answers, platform);
  console.log('[playlist] searchQuery:', searchQuery);

  let [mainResults, blogArtist] = await Promise.all([
    searchWebForPlaylists(searchQuery, platform, 20),
    searchBlogForArtist(answers),
  ]);

  if (mainResults.length === 0) {
    const fallback = artistName ?? answers.genre_resonance ?? (answers.current_music ? GENRE_LABEL[answers.current_music] : null) ?? 'music';
    mainResults = await searchWebForPlaylists(fallback, platform, 20);
  }

  console.log('[playlist] mainResults count:', mainResults.length, '| blogArtist:', blogArtist);

  const blogResults = blogArtist
    ? await searchWebForPlaylists(`${blogArtist} ${eraText}`.trim(), platform, 10)
    : [];

  console.log('[playlist] blogResults count:', blogResults.length);

  const allCandidates = [...mainResults, ...blogResults.slice(0, 1)];
  const seen = new Set<string>();
  const deduped = allCandidates.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  console.log('[playlist] deduped candidates:', deduped.length);

  const picked = pickByScenario(deduped, wantDiscovery).slice(0, 3);

  console.log('[playlist] picked:', picked.map(p => p.name));

  const oembeds = await Promise.all(picked.map(p => fetchThumbnail(p)));

  return {
    searchQuery,
    playlists: picked.map((p, i) => ({
      ...p,
      name:        p.name || oembeds[i].title || 'Untitled playlist',
      thumbnailUrl: oembeds[i].thumbnail,
    })),
  };
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

const DEMO_RESULT: PlaylistSearchResult = {
  searchQuery: 'indie electronic dream pop',
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
    queryFn: () => isDemo ? DEMO_RESULT : findPlaylists(answers),
    enabled: Object.keys(answers).length > 0,
    staleTime: Infinity,
    retry: 1,
  });
}
