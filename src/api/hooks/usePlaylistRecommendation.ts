import { useQuery } from '@tanstack/react-query';

import { useArtistPreferences } from '@src/state/artistPreferences/ArtistPreferencesProvider';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const SERPER_KEY = process.env.EXPO_PUBLIC_SERPER_API_KEY ?? '';

// ─── Answer label maps (update these when quiz questions change) ──────────────

const AESTHETIC_ENERGY: Record<string, string> = {
  record_store:    'indie, analog warmth — no high-energy bangers',
  rooftop_golden:  'elevated and social — needs to feel curated and confident',
  empty_theater:   'atmospheric and cinematic — nothing too upbeat or obvious',
  late_night_drive:'nocturnal and moody — forward momentum, slightly dark',
};

const MUSIC_ROLE: Record<string, string> = {
  process_emotions:     'lyric-focused, emotionally resonant',
  background_listening: 'ambient, unobtrusive, no jarring moments',
  my_personality:       'identity-driven, genre-conscious, tasteful',
  discover_worlds:      'exploratory and eclectic',
  time_machine:         'era-specific nostalgia',
};

const DISCOVERY_MODE: Record<string, string> = {
  algorithm:        'popular, well-known, accessible',
  friend_trust:     'well-curated, quality over quantity',
  digging:          'deep cuts, obscure, underground',
  artist_to_artist: 'cohesive sound, similar artists throughout',
  same_stuff:       'familiar, safe, established favorites',
};

const ASPIRATION_TILT: Record<string, string> = {
  more_creative:    'experimental, art-adjacent, slightly challenging',
  more_grounded:    'organic, acoustic, rooted',
  more_adventurous: 'genre-crossing, eclectic',
  more_disciplined: 'focused, instrumental-friendly, minimal',
  more_magnetic:    'bold, confident, scene-defining',
};

const ERA_TEXT: Record<string, string> = {
  era_70s:   'pre-1990s, vintage, classic era',
  era_90s:   '1990s — alternative, grunge, hip-hop',
  era_2000s: '2000s — indie, emo, blog era',
  era_2010s: '2010s — indie blog era, dream pop',
  era_now:   'current 2020s releases',
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

// ─── OpenAI — generate search query ──────────────────────────────────────────

async function buildSearchQuery(
  answers: Record<string, string>,
  favoriteArtists: string[],
  skipArtists: string[],
): Promise<string> {
  const artistName = answers.artist_lane?.startsWith('custom:')
    ? answers.artist_lane.slice(7)
    : null;

  const inferredGenre    = answers.inferred_genre ?? null;
  const eraText          = answers.era_pull ? ERA_TEXT[answers.era_pull] ?? null : null;
  const aestheticEnergy  = answers.aesthetic_world ? AESTHETIC_ENERGY[answers.aesthetic_world] ?? null : null;
  const musicRoleText    = answers.music_role ? MUSIC_ROLE[answers.music_role] ?? null : null;
  const aspirationText   = answers.aspiration ? ASPIRATION_TILT[answers.aspiration] ?? null : null;

  const skipClause = skipArtists.length > 0
    ? `Do NOT generate a query that would surface playlists primarily focused on: ${skipArtists.join(', ')}`
    : null;

  let prompt: string;

  if (artistName) {
    prompt = [
      `Generate a 3-6 word Spotify playlist search query to find playlists where ${artistName} would be curated alongside similar artists.`,
      ``,
      `Think: what would a human curator write as the name or description of a playlist that includes ${artistName}?`,
      ``,
      `Artist: ${artistName}`,
      favoriteArtists.length > 1
        ? `Listener also likes: ${favoriteArtists.filter(a => a !== artistName).slice(0, 3).join(', ')}`
        : null,
      inferredGenre   ? `Artist's primary genre: ${inferredGenre} — anchor the query to this genre` : null,
      eraText         ? `Era preference: ${eraText}` : null,
      aestheticEnergy ? `Energy constraint: ${aestheticEnergy}` : null,
      aspirationText  ? `Style tilt: ${aspirationText}` : null,
      skipClause,
      ``,
      `Return JSON: { "query": "your search query here" }`,
      `The query must sound like a real playlist title a human curator would write.`,
      `Never use: "chill", "vibes", "relaxing", "good music", "playlist".`,
      `Keep it 3-6 words.`,
    ].filter(Boolean).join('\n');
  } else {
    prompt = [
      `Generate a concise Spotify playlist search query (3-6 words) based on this listener's profile.`,
      ``,
      aestheticEnergy ? `Aesthetic/energy: ${aestheticEnergy}` : null,
      musicRoleText   ? `Music relationship: ${musicRoleText}` : null,
      aspirationText  ? `Style tilt: ${aspirationText}` : null,
      eraText         ? `Era: ${eraText}` : null,
      favoriteArtists.length > 0
        ? `Listener likes: ${favoriteArtists.slice(0, 3).join(', ')}`
        : null,
      skipClause,
      ``,
      `Return JSON: { "query": "your search query here" }`,
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

const PLATFORM_SITE: Record<Platform, string> = {
  spotify: 'site:open.spotify.com/playlist',
  apple:   'site:music.apple.com/playlist OR site:music.apple.com/us/playlist',
  youtube: 'site:youtube.com/playlist',
};

interface RawPlaylist { id: string; name: string; description: string; url: string; platform: Platform }

async function searchWebForPlaylists(query: string, platform: Platform): Promise<RawPlaylist[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `${PLATFORM_SITE[platform]} ${query}`, num: 10 }),
  });

  if (!res.ok) {
    console.warn(`[playlist] Serper search failed (${res.status})`);
    return [];
  }

  const data = await res.json();
  const seen = new Set<string>();

  return ((data.organic ?? []) as SerperOrganic[])
    .map((r): RawPlaylist | null => {
      let id: string | undefined;
      let url: string;

      if (platform === 'spotify') {
        id = r.link.match(/playlist\/([A-Za-z0-9]+)/)?.[1];
        if (!id) return null;
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
      return !/(podcast|episode|interview|show notes|hosted by|host:|listen now|guest:|chapter \d)/i.test(text);
    });
}

// ─── Music blog search — artist discovery ────────────────────────────────────

const BLOG_SITE_QUERY =
  'site:gorillavsbear.net OR site:stereogum.com OR site:thefader.com OR site:tinymixtapes.com OR site:pitchfork.com OR site:numerogroup.com OR site:aquariusrecords.org';

async function searchBlogForArtist(
  answers: Record<string, string>,
  favoriteArtists: string[],
): Promise<string | null> {
  try {
    const artist      = answers.artist_lane?.startsWith('custom:') ? answers.artist_lane.slice(7) : null;
    const inferredGenre = answers.inferred_genre ?? null;
    const eraText     = answers.era_pull ? ERA_TEXT[answers.era_pull] ?? null : null;
    const focus       = artist ?? inferredGenre ?? favoriteArtists[0] ?? null;

    if (!focus) return null;

    const q = [focus, eraText, 'recommendation'].filter(Boolean).join(' ');

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `${q} ${BLOG_SITE_QUERY}`, num: 5 }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const organic = (data.organic ?? []) as SerperOrganic[];
    if (organic.length === 0) return null;

    const context = organic
      .map(r => `${r.title}: ${r.snippet ?? ''}`)
      .join('\n')
      .slice(0, 1200);

    const known = [focus, ...favoriteArtists].filter(Boolean).join(', ');

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Music blog snippets for someone who likes ${focus}:\n\n${context}\n\nExtract ONE specific underrated or emerging artist name that would be a great discovery for this listener. Do not suggest: ${known}.\nReturn JSON: { "artist": "Artist Name" } or { "artist": null } if nothing fits.`,
        }],
        response_format: { type: 'json_object' },
        max_tokens: 60,
        temperature: 0.3,
      }),
    });

    if (!gptRes.ok) return null;

    const gptData = await gptRes.json();
    const parsed = JSON.parse(gptData.choices?.[0]?.message?.content ?? '{}') as { artist?: string | null };
    return parsed.artist ?? null;
  } catch {
    return null;
  }
}

// ─── Obsessed mode — find a playlist that definitely has the artist ───────────

async function searchBlogPlaylistForArtist(artistName: string): Promise<RawPlaylist | null> {
  try {
    const blogRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `"${artistName}" spotify playlist ${BLOG_SITE_QUERY}`, num: 10 }),
    });

    if (blogRes.ok) {
      const blogData = await blogRes.json();
      for (const r of (blogData.organic ?? []) as SerperOrganic[]) {
        const combined = `${r.link} ${r.snippet ?? ''}`;
        const match = combined.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/);
        if (match) {
          return { id: match[1], name: r.title.split(' • ')[0]?.trim() ?? r.title, description: r.snippet ?? '', url: `https://open.spotify.com/playlist/${match[1]}`, platform: 'spotify' };
        }
      }
    }

    const spotifyRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: `site:open.spotify.com/playlist "${artistName}"`, num: 5 }),
    });

    if (!spotifyRes.ok) return null;
    const first = ((await spotifyRes.json()).organic ?? [])[0] as SerperOrganic | undefined;
    if (!first) return null;

    const id = first.link.match(/playlist\/([A-Za-z0-9]+)/)?.[1];
    if (!id) return null;

    return { id, name: first.title.split(' • ')[0]?.trim() ?? first.title, description: first.snippet ?? '', url: `https://open.spotify.com/playlist/${id}`, platform: 'spotify' };
  } catch {
    return null;
  }
}

// ─── Spotify oembed — fetch thumbnail ────────────────────────────────────────

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

// ─── Scenario-based selection ─────────────────────────────────────────────────

function pickByDiscoveryMode(candidates: RawPlaylist[], discoveryMode: string): RawPlaylist[] {
  const m = candidates.length;
  if (m === 0) return [];

  if (discoveryMode === 'digging') {
    return candidates.slice(Math.max(0, m - 3)).reverse();
  }

  const startFraction: Record<string, number> = {
    algorithm:  0,
    same_stuff: 0,
    friend_trust:    0.2,
    artist_to_artist: 0.2,
  };
  const frac = startFraction[discoveryMode] ?? 0;
  const startIdx = Math.min(Math.floor(m * frac), Math.max(0, m - 3));
  return candidates.slice(startIdx, startIdx + 3);
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function findPlaylists(
  answers: Record<string, string>,
  favoriteArtists: string[],
  skipArtists: string[],
): Promise<PlaylistSearchResult> {
  const platform = resolvePlatform(answers);
  const searchQuery = await buildSearchQuery(answers, favoriteArtists, skipArtists);
  console.log('[playlist] query:', searchQuery, 'platform:', platform);

  const hasChosenArtist = !!answers.artist_lane?.startsWith('custom:');
  const isDeepDiscovery = answers.discovery_mode === 'digging' || answers.discovery_mode === 'artist_to_artist';
  const shouldRunBlogArtist = hasChosenArtist && isDeepDiscovery && platform === 'spotify';

  const raw = await searchWebForPlaylists(searchQuery, platform);

  let picked: RawPlaylist[];

  if (shouldRunBlogArtist && hasChosenArtist) {
    const artistName = answers.artist_lane!.slice(7);
    const [blogArtist, blogPlaylist] = await Promise.all([
      searchBlogForArtist(answers, favoriteArtists),
      searchBlogPlaylistForArtist(artistName),
    ]);

    const standard = raw.slice(0, blogPlaylist ? 1 : blogArtist ? 2 : 3);
    let blogPick: RawPlaylist[] = [];
    if (blogArtist) {
      const eraText = answers.era_pull ? ERA_TEXT[answers.era_pull] ?? '' : '';
      const blogRaw = await searchWebForPlaylists(`${blogArtist} ${eraText}`.trim(), 'spotify');
      blogPick = blogRaw.slice(0, 1);
    }
    picked = [...standard, ...blogPick, ...(blogPlaylist ? [blogPlaylist] : [])].slice(0, 3);
  } else {
    picked = pickByDiscoveryMode(raw, answers.discovery_mode ?? 'friend_trust').slice(0, 3);
  }

  const thumbnails = await Promise.all(picked.map(p => fetchThumbnail(p)));

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
    { id: 'demo_p1', name: 'late night frequencies', description: 'electronic and indie for the hours when everything slows down', url: 'https://open.spotify.com/genre/indie-page', platform: 'spotify', thumbnailUrl: null },
    { id: 'demo_p2', name: 'bedroom pop essentials', description: 'intimate, lo-fi, and just a little hazy', url: 'https://open.spotify.com/genre/lofi-page', platform: 'spotify', thumbnailUrl: null },
    { id: 'demo_p3', name: 'underground sounds', description: 'hidden gems from the edges of indie and electronic', url: 'https://open.spotify.com/genre/electronic-page', platform: 'spotify', thumbnailUrl: null },
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
