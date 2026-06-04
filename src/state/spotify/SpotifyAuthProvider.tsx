import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const SCOPES = ['user-top-read', 'user-read-recently-played', 'user-read-private', 'playlist-modify-public', 'playlist-modify-private', 'ugc-image-upload'];
const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'ready-set-disco', path: 'callback' });

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const TOKEN_KEY = 'spotify_access_token';
const REFRESH_KEY = 'spotify_refresh_token';
const EXPIRY_KEY = 'spotify_token_expiry';
const USER_ID_KEY = 'spotify_user_id';

// ─── Token refresh ────────────────────────────────────────────────────────────

async function doRefresh(refreshToken: string): Promise<{ accessToken: string; expiresAt: number } | null> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }).toString(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SpotifyAuthContextValue {
  accessToken: string | null;
  spotifyUserId: string | null;
  isConnected: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  connect: () => void;
  connectAsGuest: () => void;
  disconnect: () => Promise<void>;
  ensureValidToken: () => Promise<string | null>;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextValue | null>(null);

export const SpotifyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const posthog = usePostHog();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spotifyUserId, setSpotifyUserId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    { clientId: CLIENT_ID, scopes: SCOPES, usePKCE: true, redirectUri: REDIRECT_URI, extraParams: { show_dialog: 'true' } },
    discovery,
  );

  // Load persisted session on mount, refreshing if expired
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userId = await SecureStore.getItemAsync(USER_ID_KEY);
      const expiryStr = await SecureStore.getItemAsync(EXPIRY_KEY);

      if (token) {
        const isExpired = expiryStr
          ? Date.now() > parseInt(expiryStr, 10) - 60_000
          : false; // no expiry record = pre-refresh-feature token, trust it

        if (isExpired) {
          const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
          if (storedRefresh) {
            const refreshed = await doRefresh(storedRefresh);
            if (refreshed) {
              await SecureStore.setItemAsync(TOKEN_KEY, refreshed.accessToken);
              await SecureStore.setItemAsync(EXPIRY_KEY, refreshed.expiresAt.toString());
              setAccessToken(refreshed.accessToken);
            } else {
              // Refresh failed — clear session, user must re-auth
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              await SecureStore.deleteItemAsync(REFRESH_KEY);
              await SecureStore.deleteItemAsync(EXPIRY_KEY);
              await SecureStore.deleteItemAsync(USER_ID_KEY);
            }
          }
          // No refresh token → leave accessToken null, user must re-auth
        } else {
          setAccessToken(token);
        }
      }

      if (userId) setSpotifyUserId(userId);
      setIsLoading(false);
    })();
  }, []);

  const codeVerifierRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (request?.codeVerifier) codeVerifierRef.current = request.codeVerifier;
  }, [request?.codeVerifier]);

  // Handle OAuth callback
  useEffect(() => {
    if (response?.type !== 'success') return;
    const { code } = response.params;

    (async () => {
      const tokenRes = await AuthSession.exchangeCodeAsync(
        {
          clientId: CLIENT_ID,
          code,
          redirectUri: REDIRECT_URI,
          extraParams: { code_verifier: codeVerifierRef.current ?? '' },
        },
        discovery,
      );

      const expiresAt = Date.now() + (tokenRes.expiresIn ?? 3600) * 1000;
      await SecureStore.setItemAsync(TOKEN_KEY, tokenRes.accessToken);
      await SecureStore.setItemAsync(EXPIRY_KEY, expiresAt.toString());
      if (tokenRes.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, tokenRes.refreshToken);
      }
      setAccessToken(tokenRes.accessToken);
      posthog?.capture('spotify_connected');

      const meRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${tokenRes.accessToken}` },
      });
      const me = await meRes.json();
      await SecureStore.setItemAsync(USER_ID_KEY, me.id);
      setSpotifyUserId(me.id);
    })();
  }, [response]);

  const connect = useCallback(() => {
    promptAsync();
  }, [promptAsync]);

  const connectAsGuest = useCallback(() => {
    setIsDemoMode(true);
    setAccessToken('__demo__');
    setSpotifyUserId('demo_user');
  }, []);

  const disconnect = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(EXPIRY_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    setAccessToken(null);
    setSpotifyUserId(null);
    setIsDemoMode(false);
  }, []);

  // Call this before any write operation to guarantee a fresh token
  const ensureValidToken = useCallback(async (): Promise<string | null> => {
    const expiryStr = await SecureStore.getItemAsync(EXPIRY_KEY);
    // No expiry stored = pre-refresh-feature token, optimistically trust it
    if (!expiryStr) return accessToken;
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() < expiry - 60_000) return accessToken;
    const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!storedRefresh) return null;
    const refreshed = await doRefresh(storedRefresh);
    if (!refreshed) return null;
    await SecureStore.setItemAsync(TOKEN_KEY, refreshed.accessToken);
    await SecureStore.setItemAsync(EXPIRY_KEY, refreshed.expiresAt.toString());
    setAccessToken(refreshed.accessToken);
    return refreshed.accessToken;
  }, [accessToken]);

  return (
    <SpotifyAuthContext.Provider
      value={{ accessToken, spotifyUserId, isConnected: !!accessToken, isDemoMode, isLoading, connect, connectAsGuest, disconnect, ensureValidToken }}
    >
      {children}
    </SpotifyAuthContext.Provider>
  );
};

export function useSpotifyAuth(): SpotifyAuthContextValue {
  const ctx = useContext(SpotifyAuthContext);
  if (!ctx) throw new Error('useSpotifyAuth must be used within SpotifyAuthProvider');
  return ctx;
}
