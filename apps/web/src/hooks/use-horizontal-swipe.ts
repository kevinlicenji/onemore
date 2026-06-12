'use client';

import { useCallback, useRef } from 'react';

import {
  isSwipeInteractiveTarget,
  resolveSwipeDirection,
  type SwipeDirection,
} from '@/lib/horizontal-swipe';

interface UseHorizontalSwipeOptions {
  enabled?: boolean;
  onSwipe?: (direction: SwipeDirection) => void;
}

interface TouchPoint {
  x: number;
  y: number;
}

interface HorizontalSwipeHandlers {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
}

/**
 * Touch handlers for horizontal swipe gestures on mobile workout screens.
 */
export function useHorizontalSwipe({
  enabled = true,
  onSwipe,
}: UseHorizontalSwipeOptions): HorizontalSwipeHandlers {
  const touchStartRef = useRef<TouchPoint | null>(null);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) {
        return;
      }
      if (isSwipeInteractiveTarget(event.target)) {
        touchStartRef.current = null;
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || touchStartRef.current === null) {
        return;
      }
      const touch = event.changedTouches[0];
      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const direction = resolveSwipeDirection({
        deltaX: touch.clientX - touchStartRef.current.x,
        deltaY: touch.clientY - touchStartRef.current.y,
      });
      touchStartRef.current = null;

      if (direction) {
        onSwipe?.(direction);
      }
    },
    [enabled, onSwipe],
  );

  return { onTouchStart, onTouchEnd };
}
