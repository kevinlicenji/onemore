export type SwipeDirection = 'left' | 'right';

export interface SwipeGesture {
  deltaX: number;
  deltaY: number;
}

const DEFAULT_THRESHOLD = 72;
const MAX_VERTICAL_DRIFT = 48;

/**
 * Resolves a horizontal swipe from touch deltas. Swipe left means finger moved left (next item).
 */
export function resolveSwipeDirection(
  gesture: SwipeGesture,
  threshold = DEFAULT_THRESHOLD,
  maxVerticalDrift = MAX_VERTICAL_DRIFT,
): SwipeDirection | null {
  if (Math.abs(gesture.deltaY) > maxVerticalDrift) {
    return null;
  }
  if (gesture.deltaX <= -threshold) {
    return 'left';
  }
  if (gesture.deltaX >= threshold) {
    return 'right';
  }
  return null;
}

/**
 * Returns true when the event target is an interactive element that should not start a swipe.
 */
export function isSwipeInteractiveTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') {
    return false;
  }

  return Boolean(
    (target as Element).closest(
      'input, textarea, button, select, a, [role="slider"], [contenteditable="true"], [data-no-swipe], [data-wheel-picker]',
    ),
  );
}
