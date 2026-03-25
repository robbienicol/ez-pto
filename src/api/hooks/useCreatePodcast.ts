import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@src/state/auth/AuthProvider';
import { CONFIG } from '@src/config';

export type AudioFormat = 'podcast' | 'radio' | 'audiobook';

export interface CreatePodcastInput {
  topic: string;
  lengthMinutes: number;
  format: AudioFormat;
}

export interface CreatedPodcast {
  id: string;
  topic: string;
  title: string;
  audioUrl: string;
  lengthMinutes: number;
  format: AudioFormat;
  createdAt: string;
}

async function postCreatePodcast(
  input: CreatePodcastInput,
  token: string | null,
): Promise<CreatedPodcast> {
  const response = await fetch(`${CONFIG.apiBaseUrl}/api/podcasts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to create podcast (status ${response.status})`);
  }
  return response.json() as Promise<CreatedPodcast>;
}

export function useCreatePodcast() {
  const { getToken } = useAuth();

  const { mutate, isPending, error, data, reset } = useMutation({
    mutationFn: async (input: CreatePodcastInput) => {
      const token = await getToken();
      return postCreatePodcast(input, token);
    },
  });

  return {
    createPodcast: mutate,
    isPending,
    error: error instanceof Error ? error.message : null,
    createdPodcast: data ?? null,
    reset,
  };
}
