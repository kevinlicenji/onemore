'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import {
  flushSyncQueue,
  getPendingSyncCount,
  hydrateOfflineCatalog,
  pullDelta,
} from '@/lib/offline/sync-engine';
import { hydrateDashboardData } from '@/lib/offline/hydrate-dashboard';
import { invalidateDashboardCache } from '@/lib/dashboard/dashboard-cache';

interface SyncContextValue {
  pendingCount: number;
  isSyncing: boolean;
  refreshPendingCount: () => Promise<void>;
  retrySync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/**
 * Manages offline hydration, delta pulls, and sync queue flushing.
 */
export function SyncProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { accessToken, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async (): Promise<void> => {
    const count = await getPendingSyncCount();
    setPendingCount(count);
  }, []);

  const retrySync = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setIsSyncing(true);
    try {
      await flushSyncQueue(accessToken);
      if (user) {
        await pullDelta(accessToken, user.id);
      }
    } finally {
      await refreshPendingCount();
      setIsSyncing(false);
    }
  }, [accessToken, refreshPendingCount, user]);

  useEffect(() => {
    if (!accessToken || !user) {
      setPendingCount(0);
      return;
    }

    void (async () => {
      try {
        await hydrateOfflineCatalog(accessToken, user.id);
        await hydrateDashboardData(accessToken);
        invalidateDashboardCache();
        await refreshPendingCount();
      } catch {
        await refreshPendingCount();
      }
    })();
  }, [accessToken, refreshPendingCount, user]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const handleOnline = (): void => {
      void retrySync();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [accessToken, retrySync]);

  const value = useMemo(
    () => ({
      pendingCount,
      isSyncing,
      refreshPendingCount,
      retrySync,
    }),
    [pendingCount, isSyncing, refreshPendingCount, retrySync],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

/**
 * Access offline sync state from client components.
 */
export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return ctx;
}
