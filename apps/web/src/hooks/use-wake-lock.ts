'use client';

import { useEffect } from 'react';

/**
 * Keeps the screen awake while `active` is true (e.g. during rest timer).
 *
 * @param active - Whether wake lock should be held.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquireLock(): Promise<void> {
      try {
        lock = await navigator.wakeLock.request('screen');
        lock.addEventListener('release', () => {
          if (!cancelled && active) {
            void acquireLock();
          }
        });
      } catch {
        // Wake lock may be denied by browser policy or battery saver.
      }
    }

    void acquireLock();

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible' && active) {
        void acquireLock();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void lock?.release();
      lock = null;
    };
  }, [active]);
}
