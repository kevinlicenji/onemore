'use client';

import type { UserProfile } from '@onemore/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { fetchUserProfile } from '@/lib/api-auth';
import { API_BASE_URL } from '@/lib/api-config';
import { identifyUser } from '@/lib/analytics';
import { allowInjectedE2eSession, E2E_SESSION_STORAGE_KEY } from '@/lib/e2e-bypass';
import { refreshAccessToken } from '@/lib/refresh-access-token';

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

interface StoredE2eSession {
  accessToken: string;
  user: AuthUser;
}

function readStoredE2eSession(): StoredE2eSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(E2E_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredE2eSession;
  } catch {
    return null;
  }
}

function writeStoredE2eSession(accessToken: string, authUser: AuthUser): void {
  sessionStorage.setItem(E2E_SESSION_STORAGE_KEY, JSON.stringify({ accessToken, user: authUser }));
}

/**
 * Holds access token in memory, loads profile, and refreshes via httpOnly cookie proxy.
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const setProfile = useCallback((nextProfile: UserProfile) => {
    setProfileState(nextProfile);
    identifyUser(nextProfile.id);
  }, []);

  const setSession = useCallback((token: string, authUser: AuthUser) => {
    accessTokenRef.current = token;
    setAccessToken(token);
    setUser(authUser);
  }, []);

  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(E2E_SESSION_STORAGE_KEY)) {
      sessionStorage.removeItem(E2E_SESSION_STORAGE_KEY);
    }
    accessTokenRef.current = null;
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
    const data = await refreshAccessToken();
    if (!data) {
      // Keep an in-memory token from login/register when refresh cookie is unavailable.
      const hasInjectedSession = readStoredE2eSession() !== null;
      if (!accessTokenRef.current && !hasInjectedSession) {
        clearSession();
      }
      return false;
    }
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
    const bypass = allowInjectedE2eSession();

    if (bypass) {
      (
        window as Window & {
          __e2eSetSession?: (token: string, authUser: AuthUser) => void;
        }
      ).__e2eSetSession = (token, authUser) => {
        writeStoredE2eSession(token, authUser);
        setSession(token, authUser);
        setIsLoading(false);
      };
    }

    const persisted = readStoredE2eSession();
    if (persisted) {
      setSession(persisted.accessToken, persisted.user);
      setIsLoading(false);
      return;
    }

    if (bypass) {
      setIsLoading(false);
      return;
    }

    void refreshSession().finally(() => {
      setIsLoading(false);
    });
  }, [refreshSession, setSession]);

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
 * Login with email or username — sets refresh cookie and in-memory access token.
 */
export async function loginWithPassword(
  identifier: string,
  password: string,
): Promise<{ accessToken: string; user: AuthUser }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
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
