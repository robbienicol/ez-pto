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
  want_intense:  "That energy exists.",
  want_deep:     "The good stuff is always off the beaten path.",
  want_creative: "Music hits different when it's personal.",
  want_cool:     "Understated always wins.",
  want_magnetic: "Good energy is contagious.",
  plays_yes:      "niceee great vibes.",
  plays_used_to:  "I'm sure u still got it.",
  plays_learning: "The best time to start is now! Anyways,",
  plays_no:       "No worries neither do I. Anyways,",
  scene_underground: "The real ones always find each other.",
  scene_pop:         "Culture moves and you move with it.",
  scene_emotional:   "Music hits different when it's personal.",
  scene_explorer:    "The playlist is never finished.",
  scene_energy:      "The right song changes everything.",
  res_emotion:    "Feeling over everything.",
  res_energy:     "The vibe is the message.",
  res_culture:    "The scene is part of the music.",
  res_production: "The sound is the art.",
  res_lyrics:     "Words carry everything.",
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
    id: 'social_energy',
    prompt: "Pick a drink.",
    options: [
      { label: 'Energy drink', sublabel: '', value: 'setting_gym' },
      { label: 'Big Gulp', sublabel: '', value: 'setting_drive' },

      { label: 'Morning Coffee', sublabel: '', value: 'setting_study' },
      { label: 'Whatever the cool kids drink', sublabel: '', value: 'setting_social' },
      { label: 'Hot Tea', sublabel: '', value: 'setting_solo' },
    ],
  },
  {
    id: 'artist_lane',
    prompt: "Who have you been listening to recently?",
    subtitle: '',
    options: [],
    allowWriteIn: true,
    writeInLabel: 'Type an artist...',
    writeInDefaultExpanded: true,
  },

  {
    id: 'rate_app',
    prompt: 'Honestly great choice. Would you mind rating the app?',
    subtitle: 'It helps us reach more people',
    options: [],
  },
  {
    id: 'genre_resonance',
    prompt: 'Which of these sub-genres resonates with you most?',
    options: [], // populated dynamically from the artist genre fetch
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
    id: 'social_self',
    prompt: 'Do your friends think of you as...',
    options: [
      { label: 'The fun one', sublabel: 'Good energy, always down, magnetic', value: 'the_fun_one' },
      { label: 'The deep one', sublabel: 'Real conversations, thoughtful, not surface level', value: 'the_deep_one' },
      { label: 'The ambitious one', sublabel: 'Always working, always leveling up', value: 'the_ambitious_one' },
      { label: 'The chill one', sublabel: 'Easygoing, unbothered, go with the flow', value: 'the_chill_one' },
    ],
  },

  {
    id: 'missing_quality',
    prompt: 'Love it. What kind of vibe do you want a new playlist to give off?',
    options: [
      { label: 'Make me feel unstoppable', sublabel: 'High energy, locked in, nothing can touch me', value: 'want_intense' },
      { label: 'Take me somewhere new', sublabel: "Deep cuts, something I've never heard before", value: 'want_deep' },
      { label: 'Hit me right in the feels', sublabel: 'Emotional, moving, makes me feel something real', value: 'want_creative' },
      { label: 'Cool and effortless', sublabel: 'Smooth, confident, understated', value: 'want_cool' },
      { label: 'Get the party going', sublabel: "High energy, feel-good, can't sit still", value: 'want_magnetic' },
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
