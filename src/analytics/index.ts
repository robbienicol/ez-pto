import { usePostHog } from 'posthog-react-native';

export function useAnalytics() {
  const posthog = usePostHog();

  return {
    quizStarted: () =>
      posthog?.capture('quiz_started'),

    quizCompleted: (answers: Record<string, string>) =>
      posthog?.capture('quiz_completed', {
        vibe: answers.current_vibe,
        discovery: answers.discovery,
        popularity: answers.listening_scenario,
      }),

    playlistGenerated: (playlistCount: number) =>
      posthog?.capture('playlists_found', { playlist_count: playlistCount }),

    retakeClicked: () =>
      posthog?.capture('retake_clicked'),

    shareClicked: () =>
      posthog?.capture('share_clicked'),

    spotifyConnected: () =>
      posthog?.capture('spotify_connected'),

    ageSelected: (age: string) =>
      posthog?.capture('age_selected', { age }),

    genderSelected: (gender: string) =>
      posthog?.capture('gender_selected', { gender }),

    eraSelected: (era: string) =>
      posthog?.capture('era_selected', { era }),

    playlistRated: (rating: 'thumbs_up' | 'thumbs_down') =>
      posthog?.capture('playlist_rated', { rating }),
  };
}
