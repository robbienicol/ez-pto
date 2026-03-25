export const CONFIG = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
} as const;

export const DEBUG = {
  enableMocking: false,
} as const;
