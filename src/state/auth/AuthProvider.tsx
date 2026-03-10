import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  userId: string | null | undefined;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded, getToken, signOut } = useClerkAuth();
  const { user } = useUser();

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: isSignedIn ?? false,
        isLoaded,
        getToken,
        signOut,
        userId: user?.id,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
