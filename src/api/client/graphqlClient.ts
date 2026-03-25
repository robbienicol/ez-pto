import { GraphQLClient } from 'graphql-request';

import { CONFIG } from '@src/config';

interface CreateGraphqlClientArgs {
  accessToken: string | null;
}

function getGraphqlEndpointUrl(): string {
  const baseUrl = CONFIG.apiBaseUrl.trim();
  if (!baseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL (CONFIG.apiBaseUrl is empty).');
  }
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error(`EXPO_PUBLIC_API_BASE_URL must include http(s):// (got "${baseUrl}").`);
  }
  return `${baseUrl.replace(/\/$/, '')}/graphql`;
}

export function createGraphqlClient({ accessToken }: CreateGraphqlClientArgs): GraphQLClient {
  const endpointUrl = getGraphqlEndpointUrl();
  return new GraphQLClient(endpointUrl, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

