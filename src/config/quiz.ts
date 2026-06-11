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


export const NARRATOR_REACTIONS: Record<string, string> = {

  gender_man:   "Got it.",
  gender_woman: "Got it.",
  gender_nb:    "Got it.",
  gender_skip:  "No problem.",
  aspire_social:   "The room changes when you walk in.",
  aspire_grind:    "Eyes on the prize.",
  aspire_creative: "The best ones always need to make something.",
  aspire_chill:    "Peace is underrated.",
  aspire_explorer: "Most honest answer in the room.",
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
    prompt: 'What is your preferred gender?',
    
    options: [
      { label: 'Male', value: 'gender_man' },
      { label: 'Female', value: 'gender_woman' },
      { label: 'Non-binary', value: 'gender_nb' },
      { label: 'Prefer not to say', value: 'gender_skip' },
    ],
  },

  {
    id: 'location',
    prompt: 'Where are you based?',
    subtitle: "Helps us know what's moving in your area",
    options: [],
    allowWriteIn: true,
    writeInLabel: 'City or country...',
    writeInDefaultExpanded: true,
  },
  {
    id: 'social_energy',
    prompt: 'Where do you fall on the introverted/extroverted scale',
    options: [
      { label: 'Always with people', sublabel: 'Group chats popping, always doing something, know everyone', value: 'energy_social' },
      { label: 'Small circle, deep', sublabel: '2-3 people max, real conversations, don\'t need the crowd', value: 'energy_small_circle' },
      { label: 'Mostly in my own world', sublabel: 'Headphones in, doing my thing, energy is internal', value: 'energy_solo' },
      { label: 'Depends on the day', sublabel: 'Can go either way — social when I want, alone when I need', value: 'energy_mixed' },
    ],
  },
  {
    id: 'aspiration',
    prompt: 'Which version of yourself are you working toward?',
    options: [
      { label: 'The social one', sublabel: 'Always out, know everyone, life of the party', value: 'aspire_social' },
      { label: 'The grinder', sublabel: 'Building something, locked in, nothing distracts me', value: 'aspire_grind' },
      { label: 'The creative', sublabel: 'Expressing myself, making things, want to stand out', value: 'aspire_creative' },
      { label: 'The settled one', sublabel: 'Not chasing anything, comfortable, peace over noise', value: 'aspire_chill' },
      { label: 'Still figuring it out', sublabel: 'Open to everything, no fixed path, just exploring', value: 'aspire_explorer' },
    ],
  },
  {
    id: 'artist_lane',
    prompt: "which artist do you feel resonates with your current personality?",
    subtitle: 'Anyone — no judgment',
    options: [],
    allowWriteIn: true,
    writeInLabel: 'Type an artist...',
    writeInDefaultExpanded: true,
  },
  {
    id: 'rate_app',
    prompt: 'Would you mind rating the app?',
    subtitle: 'It helps us reach more people',
    options: [],
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
    prompt: 'Lastly, Where do you listen to music?',
    options: [
      { label: 'Spotify', value: 'platform_spotify' },
      { label: 'Apple Music', value: 'platform_apple' },
      { label: 'YouTube', value: 'platform_youtube' },
      { label: 'Mix of everything', value: 'platform_mixed' },
    ],
  },
];
