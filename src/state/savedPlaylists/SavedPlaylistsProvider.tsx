import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PlaylistResult } from '@src/api/hooks/usePlaylistRecommendation';

const SAVED_KEY = 'saved_playlists';
const QUIZ_DONE_KEY = 'quiz_completed';

interface SavedPlaylistsContextValue {
  savedPlaylists: PlaylistResult[];
  quizCompleted: boolean;
  savePlaylist: (playlist: PlaylistResult) => void;
  removePlaylist: (id: string) => void;
  markQuizCompleted: () => void;
}

const Ctx = createContext<SavedPlaylistsContextValue | null>(null);

export const SavedPlaylistsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedPlaylists, setSavedPlaylists] = useState<PlaylistResult[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SAVED_KEY),
      AsyncStorage.getItem(QUIZ_DONE_KEY),
    ]).then(([saved, done]) => {
      if (saved) setSavedPlaylists(JSON.parse(saved) as PlaylistResult[]);
      if (done) setQuizCompleted(true);
    });
  }, []);

  const savePlaylist = useCallback((playlist: PlaylistResult) => {
    setSavedPlaylists(prev => {
      if (prev.some(p => p.id === playlist.id)) return prev;
      const next = [playlist, ...prev];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removePlaylist = useCallback((id: string) => {
    setSavedPlaylists(prev => {
      const next = prev.filter(p => p.id !== id);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markQuizCompleted = useCallback(() => {
    setQuizCompleted(true);
    AsyncStorage.setItem(QUIZ_DONE_KEY, 'true');
  }, []);

  return (
    <Ctx.Provider value={{ savedPlaylists, quizCompleted, savePlaylist, removePlaylist, markQuizCompleted }}>
      {children}
    </Ctx.Provider>
  );
};

export function useSavedPlaylists() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSavedPlaylists must be used within SavedPlaylistsProvider');
  return ctx;
}
