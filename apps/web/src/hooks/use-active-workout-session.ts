'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { getActiveWorkoutSessionClient } from '@/lib/offline/workout-client';

interface UseActiveWorkoutSessionResult {
  session: WorkoutSessionDetail | null;
  refresh: () => Promise<void>;
}

/**
 * Loads the current in-progress workout session for resume UI.
 *
 * @returns Active session and a manual refresh helper.
 */
export function useActiveWorkoutSession(): UseActiveWorkoutSessionResult {
  const { accessToken } = useAuth();
  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      setSession(null);
      return;
    }
    try {
      const active = await getActiveWorkoutSessionClient(accessToken);
      setSession(active);
    } catch {
      setSession(null);
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function handleFocus(): void {
      void refresh();
    }
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh]);

  return { session, refresh };
}
