'use client';

import type { UserProfile } from '@onemore/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchUserProfile } from '@/lib/api-auth';
import { API_BASE_URL } from '@/lib/api-config';
import { identifyUser } from '@/lib/analytics';

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  locale: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  setProfile: (profile: UserProfile) => void;
  clearSession: () => void;
  refreshSession: () => Promise<boolean>;
  loadProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Holds access token in memory, loads profile, and refreshes via httpOnly cookie proxy.
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setProfile = useCallback((nextProfile: UserProfile) => {
    setProfileState(nextProfile);
    identifyUser(nextProfile.id);
  }, []);

  const setSession = useCallback((token: string, authUser: AuthUser) => {
    setAccessToken(token);
    setUser(authUser);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setProfileState(null);
  }, []);

  const loadProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!accessToken) {
      return null;
    }
    const nextProfile = await fetchUserProfile(accessToken);
    setProfile(nextProfile);
    return nextProfile;
  }, [accessToken, setProfile]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!response.ok) {
      clearSession();
      return false;
    }
    const data = (await response.json()) as { accessToken: string; user: AuthUser };
    setSession(data.accessToken, data.user);
    try {
      const nextProfile = await fetchUserProfile(data.accessToken);
      setProfile(nextProfile);
    } catch {
      setProfileState(null);
    }
    return true;
  }, [clearSession, setSession, setProfile]);

  useEffect(() => {
    void refreshSession().finally(() => {
      setIsLoading(false);
    });
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      profile,
      accessToken,
      isLoading,
      setSession,
      setProfile,
      clearSession,
      refreshSession,
      loadProfile,
    }),
    [
      user,
      profile,
      accessToken,
      isLoading,
      setSession,
      setProfile,
      clearSession,
      refreshSession,
      loadProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access auth state from client components.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

/**
 * Login with email/password — sets refresh cookie and in-memory access token.
 */
export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ accessToken: string; user: AuthUser }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = (await response.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? 'Login failed');
  }
  return response.json() as Promise<{ accessToken: string; user: AuthUser }>;
}

/**
 * Register a new account.
 */
export async function registerAccount(payload: Record<string, unknown>): Promise<{
  accessToken: string;
  user: AuthUser;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = (await response.json()) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? 'Registration failed');
  }
  return response.json() as Promise<{ accessToken: string; user: AuthUser }>;
}
