import { useQuery } from '@tanstack/react-query';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export interface PersonalityResult {
  title: string;
  subtitle: string;
  color: 'pink' | 'purple' | 'blue' | 'gold' | 'green';
  musicIdentity: string;
  growthDirection: string;
  artistsToExplore: string[];
  blindSpot: string;
}

const AGE_LABEL: Record<string, string> = {
  age_teens:    'under 20',
  age_early20s: '20–24',
  age_late20s:  '25–29',
  age_30s:      '30–39',
  age_40plus:   '40+',
};

const GENDER_LABEL: Record<string, string> = {
  gender_man:   'male',
  gender_woman: 'female',
  gender_nb:    'non-binary',
  gender_skip:  'prefers not to say',
};

const ASPIRATION_LABEL: Record<string, string> = {
  aspire_social:   'wants to become the social one — life of the party, always out, knows everyone. Push them toward music that fuels that energy.',
  aspire_grind:    'wants to become the grinder — building something, locked in, ambitious. Push toward music that matches drive and focus.',
  aspire_creative: 'wants to become the creative — expressing themselves, making things, standing out. Push toward music with artistic depth and edge.',
  aspire_chill:    'wants to settle into themselves — peace over noise, not chasing anything. Push toward music that is smooth, intentional, assured.',
  aspire_explorer: 'still figuring it out — open to everything, no fixed path. Use the other signals to steer them somewhere specific.',
};

const SETTING_LABEL: Record<string, string> = {
  setting_gym:    'currently at the gym or working out — needs high-energy, hard-hitting music',
  setting_study:  'currently studying or grinding — needs focused, non-distracting music to lock in',
  setting_social: 'currently in a social setting with people — needs feel-good, crowd-friendly energy',
  setting_solo:   'currently alone, late night or winding down — needs atmospheric, introspective music',
  setting_drive:  'currently driving or on the move — needs momentum-driven music for the road',
};

const SOCIAL_SELF_LABEL: Record<string, string> = {
  the_fun_one:       'magnetic, high-energy, socially sought after — the one everyone wants around',
  the_deep_one:      'thoughtful and substantive, values real conversations over surface-level interaction',
  the_ambitious_one: 'driven and competitive, visibly working toward something, goal-oriented',
  the_chill_one:     'easygoing, low-maintenance, relaxed — hard to rattle or excite',
};


const CURRENT_MUSIC_LABEL: Record<string, string> = {
  music_rap:      'primarily rap and hip-hop',
  music_pop:      'mainstream pop and chart music',
  music_rock:     'rock or alternative — guitar-driven, energetic, something with edge',
  music_rnb:      'r&b and soul — smooth, emotional, feeling-driven',
  music_eclectic: 'eclectic mix with no dominant genre, mood-dependent listening',
};

const MISSING_QUALITY_LABEL: Record<string, string> = {
  want_intense:  'wants a playlist that makes them feel unstoppable — high energy, locked in',
  want_deep:     'wants a playlist that takes them somewhere new — deep cuts, discovery, never heard before',
  want_creative: 'wants a playlist that hits them in the feels — emotional, moving, personal',
  want_cool:     'wants a playlist that feels cool and effortless — smooth, confident, understated',
  want_magnetic: 'wants a playlist that gets the party going — high energy, feel-good, social',
};

const ERA_RESONANCE_LABEL: Record<string, string> = {
  era_70s:   '1970s — soul, funk, analog warmth, confident swagger',
  era_90s:   '1990s — raw, gritty, alternative or hip-hop, nothing was polished',
  era_2000s: '2000s — peak pop culture, maximalist, confident, culturally dominant',
  era_2010s: '2010s — indie blog era, lo-fi, discovery-driven, everything felt like a find',
  era_now:   'current 2020s releases — not looking back, living in the present',
};

async function fetchPersonality(answers: Record<string, string>): Promise<PersonalityResult> {
  const artistName = answers.artist_lane?.startsWith('custom:')
    ? answers.artist_lane.slice(7)
    : null;

  const prompt = [
    'You are a music identity consultant. Your entire job is to read who this person IS — their personality, lifestyle, social energy, aspirations — and tell them what music they should be listening to instead of what they currently play.',
    '',
    'CRITICAL RULES:',
    '1. The artist/genre they listed is where they ARE, not where they should be. Treat it as a starting signal only.',
    '2. You MUST recommend a different direction. Do not suggest the same artist or genre they already listen to.',
    '3. If their current taste clearly mismatches their personality (e.g. athletic social extrovert listening to pop), call it out directly and steer them somewhere that actually fits — EDM, house, hip-hop, drill, whatever matches WHO they are.',
    '4. Be bold. Do not hedge. Tell them exactly what they should be listening to and why it fits THEM specifically.',
    '5. The goal is discovery — they should finish reading and immediately want to open a new playlist.',
    '',
    'WHO THIS PERSON IS:',
    answers.age_range         ? `- Age: ${/^\d+$/.test(answers.age_range) ? answers.age_range : (AGE_LABEL[answers.age_range] ?? answers.age_range)}` : null,
    answers.gender            ? `- Gender: ${GENDER_LABEL[answers.gender] ?? answers.gender}` : null,
    answers.location          ? `- Location: ${answers.location.startsWith('custom:') ? answers.location.slice(7) : answers.location} — factor in what genres and scenes are culturally dominant or emerging in this area` : null,
    answers.aspiration        ? `- Who they are working toward becoming: ${ASPIRATION_LABEL[answers.aspiration] ?? answers.aspiration}` : null,
    answers.social_energy     ? `- Current setting / context: ${SETTING_LABEL[answers.social_energy] ?? answers.social_energy}` : null,
    answers.social_self       ? `- How friends see them: ${SOCIAL_SELF_LABEL[answers.social_self] ?? answers.social_self}` : null,
    answers.instruments       ? `- Instruments: ${{ plays_yes: 'plays one or more', plays_used_to: 'used to play', plays_learning: 'wants to learn', plays_no: 'pure listener' }[answers.instruments] ?? answers.instruments}` : null,
    artistName                ? `- Current artist they listen to (treat as starting point, NOT destination): ${artistName}` : null,
    answers.genre_resonance   ? `- The specific sub-genre that resonates most with them: ${answers.genre_resonance}` : null,
    answers.current_music     ? `- Current genre (where they are, not where they should go): ${CURRENT_MUSIC_LABEL[answers.current_music] ?? answers.current_music}` : null,
    answers.missing_quality   ? `- Playlist vibe they are looking for: ${MISSING_QUALITY_LABEL[answers.missing_quality] ?? answers.missing_quality}` : null,
    answers.era_resonance     ? `- Era they resonate with most: ${ERA_RESONANCE_LABEL[answers.era_resonance] ?? answers.era_resonance} — weight your artist recommendations and playlists toward this era` : null,
    '',
    'Now build them a music identity based on WHO THEY ARE — not what they currently play. Steer them into the lane that actually fits their personality.',
    '',
    'Return JSON with exactly these fields:',
    '{',
    '  "title": "3-5 word music archetype in ALL CAPS, starting with THE. Should feel like an identity they are stepping INTO — bold, specific, not a genre label.",',
    '  "subtitle": "one punchy sentence that makes them feel seen. Reference something specific about their personality, NOT their current artist.",',
    '  "color": "one of: pink, purple, blue, gold, green",',
    '  "musicIdentity": "3-4 sentences. First sentence: briefly acknowledge their current taste. Then pivot HARD — tell them what they should actually be listening to based on their personality and why it fits them. Name specific genres, scenes, movements. Be direct. No hedging.",',
    '  "growthDirection": "one bold sentence starting with a verb. Name a specific genre, artist, or scene they should go all-in on — something that fits their personality perfectly but they have not discovered yet.",',
    '  "artistsToExplore": ["5-7 specific artist names they should be listening to based on their identity. Mix of entry points and deeper cuts. Real artists only."],',
    '  "blindSpot": "one punchy sentence naming the one genre, scene, or era they are sleeping on that would fit them perfectly — the thing they have not discovered yet but would love."',
    '}',
    '',
    'Color guide: pink = social/expressive, purple = deep/mysterious, blue = cinematic/calm, gold = nostalgic/classic, green = exploratory/underground',
    'Title examples: "THE MIDNIGHT ARCHIVIST", "THE ANALOG ROMANTIC", "THE GOLDEN HOUR REALIST", "THE OBSESSIVE CURATOR", "THE QUIET MAXIMALIST"',
  ].filter(Boolean).join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.85,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI failed (${res.status})`);

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(text) as Partial<PersonalityResult>;

  const validColors: PersonalityResult['color'][] = ['pink', 'purple', 'blue', 'gold', 'green'];

  return {
    title:           parsed.title ?? 'THE VIBE CURATOR',
    subtitle:        parsed.subtitle ?? 'Your taste speaks for itself.',
    color:           validColors.includes(parsed.color as PersonalityResult['color'])
                       ? (parsed.color as PersonalityResult['color'])
                       : 'purple',
    musicIdentity:    parsed.musicIdentity ?? '',
    growthDirection:  parsed.growthDirection ?? '',
    artistsToExplore: Array.isArray(parsed.artistsToExplore) ? parsed.artistsToExplore.slice(0, 7) : [],
    blindSpot:        parsed.blindSpot ?? '',
  };
}

export function usePersonality(answers: Record<string, string>) {
  const enabled = Object.keys(answers).length > 0;

  return useQuery({
    queryKey: ['personality', answers],
    queryFn: () => fetchPersonality(answers),
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
}
