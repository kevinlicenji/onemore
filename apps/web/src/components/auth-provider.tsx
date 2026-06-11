'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '@/lib/api-config';

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  locale: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Holds access token in memory and refreshes via httpOnly cookie proxy.
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((token: string, authUser: AuthUser) => {
    setAccessToken(token);
    setUser(authUser);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!response.ok) {
      clearSession();
      return false;
    }
    const data = (await response.json()) as { accessToken: string; user: AuthUser };
    setSession(data.accessToken, data.user);
    return true;
  }, [clearSession, setSession]);

  useEffect(() => {
    void refreshSession().finally(() => {
      setIsLoading(false);
    });
  }, [refreshSession]);

  const value = useMemo(
    () => ({ user, accessToken, isLoading, setSession, clearSession, refreshSession }),
    [user, accessToken, isLoading, setSession, clearSession, refreshSession],
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
