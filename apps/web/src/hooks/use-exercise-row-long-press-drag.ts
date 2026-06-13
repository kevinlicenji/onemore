'use client';

import { useCallback, useRef } from 'react';

import { triggerHaptic } from '@/lib/haptic';
import { LONG_PRESS_DRAG_MS, shouldCancelLongPress } from '@/lib/long-press-drag';

interface UseExerciseRowLongPressDragOptions {
  exerciseIndex: number;
  enabled: boolean;
  onDragStart: (exerciseIndex: number, rect: DOMRect) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: () => void;
  onTap: () => void;
}

interface UseExerciseRowLongPressDragResult {
  handlePointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}

/**
 * Long-press to start overlay drag, tap to edit — used on program builder exercise cards.
 */
export function useExerciseRowLongPressDrag({
  exerciseIndex,
  enabled,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTap,
}: UseExerciseRowLongPressDragOptions): UseExerciseRowLongPressDragResult {
  const longPressTimerRef = useRef<number | null>(null);
  const dragActiveRef = useRef(false);
  const cancelledRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const clearLongPressTimer = useCallback((): void => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      if (!enabled || event.button !== 0) {
        return;
      }

      clearLongPressTimer();
      dragActiveRef.current = false;
      cancelledRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };

      const target = event.currentTarget;
      const previousBodyTouchAction = document.body.style.touchAction;
      document.body.style.touchAction = 'none';

      const handlePointerMove = (moveEvent: PointerEvent): void => {
        const deltaX = moveEvent.clientX - startRef.current.x;
        const deltaY = moveEvent.clientY - startRef.current.y;

        if (!dragActiveRef.current) {
          if (shouldCancelLongPress(deltaX, deltaY)) {
            cancelledRef.current = true;
            clearLongPressTimer();
          }
          return;
        }

        moveEvent.preventDefault();
        onDragMove(moveEvent.clientX, moveEvent.clientY);
      };

      const finish = (): void => {
        clearLongPressTimer();
        document.body.style.touchAction = previousBodyTouchAction;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', finish);
        window.removeEventListener('pointercancel', finish);

        if (dragActiveRef.current) {
          onDragEnd();
        } else if (!cancelledRef.current) {
          onTap();
        }

        dragActiveRef.current = false;
      };

      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = null;
        if (cancelledRef.current) {
          return;
        }

        dragActiveRef.current = true;
        target.setPointerCapture(event.pointerId);
        triggerHaptic('medium');
        onDragStart(exerciseIndex, target.getBoundingClientRect());
      }, LONG_PRESS_DRAG_MS);

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
    },
    [clearLongPressTimer, enabled, exerciseIndex, onDragEnd, onDragMove, onDragStart, onTap],
  );

  return { handlePointerDown };
}
