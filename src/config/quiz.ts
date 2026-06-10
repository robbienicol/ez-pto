// ─── Single source of truth for all quiz content ─────────────────────────────
// Edit questions, options, traits, and reactions here. Nothing quiz-related
// lives anywhere else.

export interface QuizOption {
  label: string;
  sublabel?: string;
  value: string;
  subtle?: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  subtitle?: string;
  options: QuizOption[];
  allowWriteIn?: boolean;
  writeInLabel?: string;
  writeInDefaultExpanded?: boolean;
}

export interface Traits {
  depth: number;
  social: number;
  edge: number;
  discovery: number;
  nostalgia: number;
  expression: number;
}

export const DEFAULT_TRAITS: Traits = {
  depth: 0, social: 0, edge: 0, discovery: 0, nostalgia: 0, expression: 0,
};

export const ANSWER_TRAITS: Record<string, Partial<Traits>> = {
  // age_range — context only, minimal trait weight
  age_teens:    { social: 10, discovery: 10 },
  age_early20s: { social: 15, discovery: 10 },
  age_late20s:  { depth: 10, edge: 10 },
  age_30s:      { depth: 15, nostalgia: 10 },
  age_40plus:   { nostalgia: 15, depth: 10 },
  // gender — context only, no trait weight
  gender_man:    {},
  gender_woman:  {},
  gender_nb:     { expression: 5 },
  gender_skip:   {},
  // life_phase
  locked_in:    { depth: 20, edge: 10 },
  figuring_out: { discovery: 20, social: 10 },
  peak_social:  { social: 25, expression: 15 },
  own_world:    { depth: 25, edge: 15, nostalgia: 10 },
  // social_energy
  energy_social:        { social: 25, expression: 15 },
  energy_small_circle:  { depth: 20, nostalgia: 10 },
  energy_solo:          { depth: 15, edge: 15, discovery: 10 },
  energy_mixed:         { social: 10, depth: 10 },
  // social_self
  the_fun_one:       { social: 25, expression: 15 },
  the_deep_one:      { depth: 25, nostalgia: 10 },
  the_ambitious_one: { edge: 20, depth: 15 },
  the_chill_one:     { nostalgia: 15, depth: 10 },
  // current_clothes
  wear_athletic: { social: 15, edge: 10 },
  wear_smart:    { expression: 15, social: 10 },
  wear_street:   { edge: 20, social: 15 },
  wear_comfort:  { depth: 10, nostalgia: 5 },
  wear_creative: { expression: 25, discovery: 15 },
  // instruments
  plays_yes:      { depth: 20, expression: 15 },
  plays_used_to:  { depth: 15, nostalgia: 10 },
  plays_learning: { discovery: 20, expression: 10 },
  plays_no:       { social: 5 },
  // music_scene
  scene_underground: { edge: 25, depth: 15, discovery: 10 },
  scene_pop:         { social: 25, expression: 15 },
  scene_emotional:   { depth: 20, nostalgia: 15, expression: 10 },
  scene_explorer:    { discovery: 25, depth: 10 },
  scene_energy:      { social: 20, edge: 15 },
  // current_music
  music_rap:      { edge: 15, social: 15 },
  music_pop:      { social: 20, expression: 10 },
  music_rock:     { edge: 20, depth: 10 },
  music_rnb:      { expression: 20, nostalgia: 15 },
  music_eclectic: { discovery: 25, depth: 10 },
  // missing_quality
  want_cool:     { edge: 20, expression: 15 },
  want_deep:     { depth: 25, nostalgia: 10 },
  want_intense:  { edge: 20, depth: 15 },
  want_magnetic: { social: 25, expression: 15 },
  want_creative: { expression: 25, discovery: 15 },
  // era_resonance
  // platform — context only
  platform_spotify: {},
  platform_apple:   {},
  platform_youtube: { discovery: 5 },
  platform_mixed:   { discovery: 5 },
  // era_resonance
  era_70s:   { nostalgia: 20, depth: 15, expression: 10 },
  era_90s:   { edge: 25, depth: 15, nostalgia: 10 },
  era_2000s: { nostalgia: 20, social: 15, expression: 10 },
  era_2010s: { discovery: 20, depth: 15 },
  era_now:   { social: 10, discovery: 10 },
};

export const NARRATOR_REACTIONS: Record<string, string> = {
  age_teens:    "Peak everything.",
  age_early20s: "Best years are happening right now.",
  age_late20s:  "The real ones figure it out now.",
  age_30s:      "Finally know what you like.",
  age_40plus:   "Taste is earned.",
  gender_man:   "Got it.",
  gender_woman: "Got it.",
  gender_nb:    "Got it.",
  gender_skip:  "No problem.",
  locked_in:         "Eyes on the target.",
  figuring_out:      "Most honest answer in the room.",
  peak_social:       "They know your name everywhere.",
  own_world:         "Self-sufficient.",
  energy_social:       "Everyone knows your name.",
  energy_small_circle: "The right people know.",
  energy_solo:         "The headphones say enough.",
  energy_mixed:        "Selectively social.",
  the_fun_one:       "Everyone texts you first.",
  the_deep_one:      "People stay longer than they planned.",
  the_ambitious_one: "They can feel it on you.",
  the_chill_one:     "Unbothered is rare.",
  wear_athletic:     "Performance, always.",
  wear_smart:        "Dressed like you know something.",
  wear_street:       "The fit communicates.",
  wear_comfort:      "Underestimated.",
  wear_creative:     "The outfit is a statement.",
  music_rap:         "Bars over everything.",
  music_pop:         "Taste is democratic.",
  music_rock:        "Something with edge.",
  music_rnb:         "Feeling first.",
  music_eclectic:    "The playlist can't be labeled.",
  want_cool:         "Already closer than you think.",
  want_deep:         "The interesting ones always wonder this.",
  want_intense:      "Single-minded is rare.",
  want_magnetic:     "It's already there.",
  want_creative:     "The urge is the identity.",
  plays_yes:      "The ear is trained.",
  plays_used_to:  "It's still in there.",
  plays_learning: "The best time to start is now.",
  plays_no:       "Pure listener.",
  scene_underground: "The real ones always find each other.",
  scene_pop:         "Culture moves and you move with it.",
  scene_emotional:   "Music hits different when it's personal.",
  scene_explorer:    "The playlist is never finished.",
  scene_energy:      "The right song changes everything.",
  rate_yes:          "You're the best.",
  rate_skip:         "No worries.",
  platform_spotify:  "Good taste.",
  platform_apple:    "Good taste.",
  platform_youtube:  "Good taste.",
  platform_mixed:    "Good taste.",
  era_70s:           "Warmth and grit.",
  era_90s:           "Nothing was sanitized.",
  era_2000s:         "The chaos was the point.",
  era_2010s:         "Every blog had a scoop.",
  era_now:           "Here for it.",
};

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 'age_range',
    prompt: 'How old are you?',
    options: [],
  },
  {
    id: 'gender',
    prompt: 'How do you identify?',
    options: [
      { label: 'Male', value: 'gender_man' },
      { label: 'Female', value: 'gender_woman' },
      { label: 'Non-binary', value: 'gender_nb' },
      { label: 'Prefer not to say', value: 'gender_skip' },
    ],
  },
  {
    id: 'life_phase',
    prompt: 'Which of these feels most like your life right now?',
    options: [
      { label: 'Locked in — building something', sublabel: 'Career, business, a specific goal', value: 'locked_in' },
      { label: 'Figuring it out', sublabel: 'Still finding my thing, in transition', value: 'figuring_out' },
      { label: 'Peak social mode', sublabel: 'Events, people, always something going on', value: 'peak_social' },
      { label: 'In my own world', sublabel: 'Head down, quiet life, low drama', value: 'own_world' },
    ],
  },
  {
    id: 'social_energy',
    prompt: 'Which one is you?',
    options: [
      { label: 'Always with people', sublabel: 'Group chats popping, always doing something, know everyone', value: 'energy_social' },
      { label: 'Small circle, deep', sublabel: '2-3 people max, real conversations, don\'t need the crowd', value: 'energy_small_circle' },
      { label: 'Mostly in my own world', sublabel: 'Headphones in, doing my thing, energy is internal', value: 'energy_solo' },
      { label: 'Depends on the day', sublabel: 'Can go either way — social when I want, alone when I need', value: 'energy_mixed' },
    ],
  },
  {
    id: 'music_scene',
    prompt: 'Which of these is most you?',
    options: [
      { label: 'The underground kid', sublabel: 'Record shops, obscure bands, Joy Division — heard it before anyone else', value: 'scene_underground' },
      { label: 'The pop culture fan', sublabel: 'Every Taylor era, chart bangers, lives for the cultural moment', value: 'scene_pop' },
      { label: 'The late night listener', sublabel: '2am drives, Frank Ocean, music that makes you actually feel something', value: 'scene_emotional' },
      { label: 'The constant digger', sublabel: 'Shazam everything, always finding the next thing before anyone else does', value: 'scene_explorer' },
      { label: 'The energy chaser', sublabel: 'Club, gym, concerts — needs music with momentum and power', value: 'scene_energy' },
    ],
  },
  {
    id: 'artist_lane',
    prompt: "Type an artist you're actually listening to right now",
    subtitle: 'Anyone — no judgment',
    options: [],
    allowWriteIn: true,
    writeInLabel: 'Type an artist...',
    writeInDefaultExpanded: true,
  },
  {
    id: 'instruments',
    prompt: 'Do you play any instruments?',
    options: [
      { label: 'Yes, I play', sublabel: "It's part of how I connect with music", value: 'plays_yes' },
      { label: 'I used to', sublabel: 'Played for a bit, not so much anymore', value: 'plays_used_to' },
      { label: 'No, but I want to learn', sublabel: 'Music pulls me in that direction', value: 'plays_learning' },
      { label: 'No — pure listener', sublabel: 'I experience music, I don\'t make it', value: 'plays_no' },
    ],
  },
  {
    id: 'rate_app',
    prompt: 'Would you mind rating the app?',
    subtitle: 'It helps us reach more people',
    options: [],
  },
  {
    id: 'social_self',
    prompt: 'Your closest friends would describe you as...',
    options: [
      { label: 'The fun one', sublabel: 'Good energy, always down, magnetic', value: 'the_fun_one' },
      { label: 'The deep one', sublabel: 'Real conversations, thoughtful, not surface level', value: 'the_deep_one' },
      { label: 'The ambitious one', sublabel: 'Always working, always leveling up', value: 'the_ambitious_one' },
      { label: 'The chill one', sublabel: 'Easygoing, unbothered, go with the flow', value: 'the_chill_one' },
    ],
  },
  {
    id: 'current_clothes',
    prompt: 'What do you actually wear most days?',
    options: [
      { label: 'Gym / athletic wear', sublabel: "Joggers, hoodies, trainers — it's the uniform", value: 'wear_athletic' },
      { label: 'Smart casual / business', sublabel: 'Clean, put together, office-ready', value: 'wear_smart' },
      { label: 'Streetwear', sublabel: 'Fits, drops, culturally aware', value: 'wear_street' },
      { label: "Whatever's comfortable", sublabel: 'No real aesthetic, functional over styled', value: 'wear_comfort' },
      { label: 'Creative / expressive', sublabel: 'Vintage, artistic, hard to categorize', value: 'wear_creative' },
    ],
  },
  {
    id: 'current_music',
    prompt: 'What does your playlist actually sound like right now?',
    options: [
      { label: 'Rap / hip-hop heavy', sublabel: "That's the main lane", value: 'music_rap' },
      { label: 'Pop / mainstream', sublabel: 'Charts, trending, recognizable', value: 'music_pop' },
      { label: 'Rock / alternative', sublabel: 'Guitar, energy, something with edge', value: 'music_rock' },
      { label: 'R&B / soul', sublabel: 'Smooth, emotional, feeling-driven', value: 'music_rnb' },
      { label: 'All over the place', sublabel: 'Depends on the mood, no one genre', value: 'music_eclectic' },
    ],
  },
  {
    id: 'missing_quality',
    prompt: 'Which of these would you most like people to associate with you?',
    options: [
      { label: 'Effortlessly cool', sublabel: 'Stylish, calm, seems to just get it', value: 'want_cool' },
      { label: 'Deep and interesting', sublabel: 'Cerebral, thoughtful, worth knowing', value: 'want_deep' },
      { label: 'Intense and focused', sublabel: 'Driven, serious about something, locked in', value: 'want_intense' },
      { label: 'Magnetic and fun', sublabel: 'Lights up a room, people gravitate toward you', value: 'want_magnetic' },
      { label: 'Creative and expressive', sublabel: 'An artist at heart, even if no one knows it yet', value: 'want_creative' },
    ],
  },
  {
    id: 'platform',
    prompt: 'Where do you listen to music?',
    options: [
      { label: 'Spotify', value: 'platform_spotify' },
      { label: 'Apple Music', value: 'platform_apple' },
      { label: 'YouTube', value: 'platform_youtube' },
      { label: 'Mix of everything', value: 'platform_mixed' },
    ],
  },
  {
    id: 'era_resonance',
    prompt: "Which era's energy speaks to where you want to be?",
    options: [
      { label: '70s soul & swagger', sublabel: 'Warm, confident, analog charisma', value: 'era_70s' },
      { label: '90s raw & real', sublabel: 'Grunge, hip-hop, nothing was polished', value: 'era_90s' },
      { label: 'Early 2000s confident', sublabel: 'Peak pop culture, swagger, maximalism', value: 'era_2000s' },
      { label: '2010s indie discovery', sublabel: 'Blog era, lo-fi, every song a find', value: 'era_2010s' },
      { label: 'Right now', sublabel: "Current wave, whatever's moving", value: 'era_now' },
    ],
  },
];
