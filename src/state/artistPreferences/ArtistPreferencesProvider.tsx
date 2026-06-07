import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'artist_preferences_v1';
const CHECK_IN_DAYS = 14;

interface StoredPrefs {
  favoriteArtists: string[];
  skipArtists: string[];
  lastConfirmedAt: string | null;
}

const DEFAULT: StoredPrefs = { favoriteArtists: [], skipArtists: [], lastConfirmedAt: null };

interface ArtistPreferencesContextValue {
  favoriteArtists: string[];
  skipArtists: string[];
  isLoaded: boolean;
  needsCheckIn: boolean;
  addFavorite: (name: string) => void;
  addSkip: (name: string) => void;
  removeFavorite: (name: string) => void;
  removeSkip: (name: string) => void;
  confirm: () => void;
}

const ArtistPreferencesContext = createContext<ArtistPreferencesContextValue | null>(null);

export const ArtistPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<StoredPrefs>(DEFAULT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setPrefs(JSON.parse(raw) as StoredPrefs); } catch { /* corrupted, start fresh */ }
      }
      setIsLoaded(true);
    });
  }, []);

  const persist = useCallback((next: StoredPrefs) => {
    setPrefs(next);
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addFavorite = useCallback((name: string) => {
    const n = name.trim();
    setPrefs(prev => {
      if (prev.favoriteArtists.some(a => a.toLowerCase() === n.toLowerCase())) return prev;
      const next = { ...prev, favoriteArtists: [...prev.favoriteArtists, n] };
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addSkip = useCallback((name: string) => {
    const n = name.trim();
    setPrefs(prev => {
      if (prev.skipArtists.some(a => a.toLowerCase() === n.toLowerCase())) return prev;
      const next = { ...prev, skipArtists: [...prev.skipArtists, n] };
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((name: string) => {
    setPrefs(prev => {
      const next = { ...prev, favoriteArtists: prev.favoriteArtists.filter(a => a !== name) };
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSkip = useCallback((name: string) => {
    setPrefs(prev => {
      const next = { ...prev, skipArtists: prev.skipArtists.filter(a => a !== name) };
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const confirm = useCallback(() => {
    setPrefs(prev => {
      const next = { ...prev, lastConfirmedAt: new Date().toISOString() };
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const needsCheckIn = useMemo(() => {
    const hasArtists = prefs.favoriteArtists.length > 0 || prefs.skipArtists.length > 0;
    if (!hasArtists) return false;
    if (!prefs.lastConfirmedAt) return true;
    const daysSince = (Date.now() - new Date(prefs.lastConfirmedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > CHECK_IN_DAYS;
  }, [prefs]);

  // suppress unused warning — persist is used inline above but kept for future batch updates
  void persist;

  return (
    <ArtistPreferencesContext.Provider
      value={{
        favoriteArtists: prefs.favoriteArtists,
        skipArtists: prefs.skipArtists,
        isLoaded,
        needsCheckIn,
        addFavorite,
        addSkip,
        removeFavorite,
        removeSkip,
        confirm,
      }}
    >
      {children}
    </ArtistPreferencesContext.Provider>
  );
};

export function useArtistPreferences(): ArtistPreferencesContextValue {
  const ctx = useContext(ArtistPreferencesContext);
  if (!ctx) throw new Error('useArtistPreferences must be used within ArtistPreferencesProvider');
  return ctx;
}
