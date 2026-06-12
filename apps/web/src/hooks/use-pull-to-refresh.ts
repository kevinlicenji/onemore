'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  calculatePullDistance,
  getRefreshProgress,
  shouldTriggerRefresh,
} from '@/lib/pull-to-refresh';
import { triggerHaptic } from '@/lib/haptic';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}

interface UsePullToRefreshResult {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

/**
 * Document-level pull-to-refresh for mobile list screens.
 *
 * @param options - Refresh callback and enable flag.
 * @returns Pull distance, refreshing state, and normalized progress.
 */
export function usePullToRefresh({
  onRefresh,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistanceRef = useRef(0);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);

  const triggerRefresh = useCallback(async (): Promise<void> => {
    refreshingRef.current = true;
    setIsRefreshing(true);
    setPullDistance(0);
    pullDistanceRef.current = 0;
    triggerHaptic('light');
    try {
      await onRefresh();
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function canPull(): boolean {
      return window.scrollY <= 0 && !refreshingRef.current;
    }

    function onTouchStart(event: TouchEvent): void {
      if (!canPull()) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      startYRef.current = touch.clientY;
      pullingRef.current = true;
    }

    function onTouchMove(event: TouchEvent): void {
      if (!pullingRef.current || !canPull()) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const delta = touch.clientY - startYRef.current;
      const distance = calculatePullDistance(delta);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
      if (distance > 0) {
        event.preventDefault();
      }
    }

    function onTouchEnd(): void {
      if (!pullingRef.current) {
        return;
      }
      if (shouldTriggerRefresh(pullDistanceRef.current)) {
        void triggerRefresh();
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      pullingRef.current = false;
      startYRef.current = 0;
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, triggerRefresh]);

  return {
    pullDistance,
    isRefreshing,
    progress: getRefreshProgress(pullDistance),
  };
}
