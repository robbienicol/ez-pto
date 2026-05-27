import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
const USER_ID_KEY = 'spotify_user_id';

interface SpotifyAuthContextValue {
  accessToken: string | null;
  spotifyUserId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextValue | null>(null);

export const SpotifyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spotifyUserId, setSpotifyUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    { clientId: CLIENT_ID, scopes: SCOPES, usePKCE: true, redirectUri: REDIRECT_URI, extraParams: { show_dialog: 'true' } },
    discovery,
  );

  // Load persisted session on mount
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userId = await SecureStore.getItemAsync(USER_ID_KEY);
      if (token) setAccessToken(token);
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

      await SecureStore.setItemAsync(TOKEN_KEY, tokenRes.accessToken);
      if (tokenRes.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_KEY, tokenRes.refreshToken);
      }
      console.log('[SpotifyAuth] token exchanged | scopes granted:', tokenRes.scope ?? 'none returned');
      setAccessToken(tokenRes.accessToken);
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

  const disconnect = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    setAccessToken(null);
    setSpotifyUserId(null);
  }, []);

  return (
    <SpotifyAuthContext.Provider
      value={{ accessToken, spotifyUserId, isConnected: !!accessToken, isLoading, connect, disconnect }}
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
