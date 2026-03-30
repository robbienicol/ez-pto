import { useMemo } from 'react';
import { gql } from 'graphql-request';
import { useMutation } from '@tanstack/react-query';

import { createGraphqlClient } from '@src/api/client/graphqlClient';
import { useAuth } from '@src/state/auth/AuthProvider';

export type AudioFormat = 'podcast' | 'radio' | 'audiobook';

/** Live radio flavor — only when `format` is `radio`. */
export type LiveRadioStyle = 'sports' | 'news_desk' | 'talk_radio' | 'open_format';

/** How the audio should feel — non–live-radio formats only. */
export type ContentTone =
  | 'conversational'
  | 'news'
  | 'educational'
  | 'storytelling'
  | 'humorous';

export interface CreateAudioInput {
  topic: string;
  format: AudioFormat;
  /** Omitted for live radio. */
  tones?: ContentTone[];
  /** Live radio only. */
  radioStyle?: LiveRadioStyle;
  /** Omitted for live radio. */
  lengthMinutes?: number;
}

export interface CreatedAudio {
  id: string;
  topic: string;
  title: string;
  audioUrl: string;
  lengthMinutes: number;
  format: AudioFormat;
  tones?: ContentTone[];
  radioStyle?: LiveRadioStyle;
  createdAt: string;
}

interface CreateAudioResponse {
  createAudio: CreatedAudio;
}

interface CreateAudioVariables {
  topic: string;
  format: string;
  tones?: string;
  radioStyle?: string;
  lengthMinutes?: number;
}

const CREATE_AUDIO = gql`
  mutation CreateAudio(
    $topic: String!
    $format: String!
    $tones: String
    $radioStyle: String
    $lengthMinutes: Int
  ) {
    createAudio(
      topic: $topic
      format: $format
      tones: $tones
      radioStyle: $radioStyle
      lengthMinutes: $lengthMinutes
    ) {
      id
      topic
      title
      audioUrl
      lengthMinutes
      format
      tones
      radioStyle
      createdAt
    }
  }
`;

function buildCreateAudioVariables(input: CreateAudioInput): CreateAudioVariables {
  const topic = input.topic.trim();
  const base: CreateAudioVariables = { topic, format: input.format };

  if (input.format === 'radio') {
    if (input.radioStyle != null) {
      base.radioStyle = input.radioStyle;
    }
    return base;
  }

  if (input.tones != null && input.tones.length > 0) {
    base.tones = input.tones.join(',');
  }
  if (input.lengthMinutes != null) {
    base.lengthMinutes = input.lengthMinutes;
  }
  return base;
}

function createAudioMutationKey(userId: string | null | undefined) {
  return ['CREATE_AUDIO', userId ?? ''] as const;
}

export function useCreateAudio() {
  const { getToken, userId } = useAuth();

  const mutationKey = useMemo(() => createAudioMutationKey(userId), [userId]);

  const { mutate, isPending, error, data, reset } = useMutation({
    mutationKey,
    mutationFn: async (input: CreateAudioInput) => {
      const accessToken = await getToken();
      if (!accessToken) {
        throw new Error('Not signed in.');
      }

      const client = createGraphqlClient({ accessToken });
      const variables = buildCreateAudioVariables(input);
      const response = await client.request<CreateAudioResponse, CreateAudioVariables>(
        CREATE_AUDIO,
        variables,
      );
      return response.createAudio;
    },
  });

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof Error ? error.message : String(error);
  }, [error]);

  return {
    createAudio: mutate,
    isPending,
    error: errorMessage,
    createdAudio: data ?? null,
    reset,
  };
}
