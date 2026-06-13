/** Milliseconds the pointer must stay down before drag reorder starts. */
export const LONG_PRESS_DRAG_MS = 450;

/** Movement in px that cancels a pending long-press (scroll tolerance). */
export const LONG_PRESS_MOVE_CANCEL_PX = 10;

/**
 * @param deltaX - Horizontal pointer movement since touch start.
 * @param deltaY - Vertical pointer movement since touch start.
 * @param threshold - Cancel radius in pixels.
 */
export function shouldCancelLongPress(
  deltaX: number,
  deltaY: number,
  threshold: number = LONG_PRESS_MOVE_CANCEL_PX,
): boolean {
  return Math.hypot(deltaX, deltaY) >= threshold;
}

/**
 * Resolves the exercise row index under a screen coordinate during drag.
 *
 * @param x - Pointer client X.
 * @param y - Pointer client Y.
 */
export function findExerciseRowIndexFromPoint(x: number, y: number): number | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const elements =
    typeof document.elementsFromPoint === 'function'
      ? document.elementsFromPoint(x, y)
      : [document.elementFromPoint(x, y)].filter((node): node is Element => node !== null);

  for (const element of elements) {
    const row = element.closest('[data-exercise-row-index]');
    if (!row) {
      continue;
    }

    const raw = row.getAttribute('data-exercise-row-index');
    if (!raw) {
      continue;
    }

    const index = Number(raw);
    if (!Number.isNaN(index)) {
      return index;
    }
  }

  return null;
}
