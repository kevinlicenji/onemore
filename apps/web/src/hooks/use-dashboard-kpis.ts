'use client';

import type { AnalyticsDashboard } from '@onemore/shared';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import {
  invalidateDashboardCache,
  loadDashboardKpisFromLocal,
} from '@/lib/dashboard/dashboard-cache';
import { subscribeDashboardInvalidation } from '@/lib/dashboard/dashboard-events';
import { hydrateDashboardData } from '@/lib/offline/hydrate-dashboard';
import { pullDelta } from '@/lib/offline/sync-engine';

interface UseDashboardKpisResult {
  dashboard: AnalyticsDashboard | null;
  isSyncing: boolean;
  refresh: () => Promise<void>;
}

/**
 * Load dashboard KPIs from IndexedDB immediately, then sync in background.
 */
export function useDashboardKpis(locale: string): UseDashboardKpisResult {
  const { accessToken, profile } = useAuth();
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadLocal = useCallback(async (): Promise<AnalyticsDashboard | null> => {
    if (!profile?.onboardingCompletedAt) {
      return null;
    }

    return loadDashboardKpisFromLocal({
      timezone: profile.timezone ?? 'Europe/Rome',
      locale,
      trainingDaysPerWeek: profile.trainingDaysPerWeek,
    });
  }, [locale, profile?.onboardingCompletedAt, profile?.timezone, profile?.trainingDaysPerWeek]);

  const refresh = useCallback(async (): Promise<void> => {
    const local = await loadLocal();
    if (local) {
      setDashboard(local);
    }
  }, [loadLocal]);

  const syncBackground = useCallback(async (): Promise<void> => {
    if (!accessToken || !profile?.id || !profile.onboardingCompletedAt) {
      return;
    }

    setIsSyncing(true);
    try {
      await pullDelta(accessToken, profile.id);
      await hydrateDashboardData(accessToken);
      invalidateDashboardCache();
      const updated = await loadLocal();
      if (updated) {
        setDashboard(updated);
      }
    } catch {
      // Keep showing local data when background sync fails offline.
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, loadLocal, profile?.id, profile?.onboardingCompletedAt]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (accessToken && profile?.onboardingCompletedAt) {
      void syncBackground();
    }
  }, [accessToken, profile?.onboardingCompletedAt, syncBackground]);

  useEffect(() => {
    return subscribeDashboardInvalidation(() => {
      void refresh();
    });
  }, [refresh]);

  return { dashboard, isSyncing, refresh };
}
