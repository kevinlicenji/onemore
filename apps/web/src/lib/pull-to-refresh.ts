/** Minimum pull distance (px) before refresh triggers on release. */
export const PULL_REFRESH_THRESHOLD = 72;

/** Maximum visible pull distance (px) with rubber-band resistance. */
export const PULL_REFRESH_MAX = 96;

/**
 * Applies rubber-band resistance to raw touch delta.
 *
 * @param rawDelta - Downward finger movement in pixels.
 * @param max - Cap for the resisted distance.
 * @returns Resisted pull distance shown in the UI.
 */
export function calculatePullDistance(rawDelta: number, max: number = PULL_REFRESH_MAX): number {
  if (rawDelta <= 0) {
    return 0;
  }
  return Math.min(max, rawDelta * 0.45);
}

/**
 * @param distance - Current resisted pull distance.
 * @param threshold - Release threshold for triggering refresh.
 * @returns Whether the user pulled far enough to refresh.
 */
export function shouldTriggerRefresh(
  distance: number,
  threshold: number = PULL_REFRESH_THRESHOLD,
): boolean {
  return distance >= threshold;
}

/**
 * @param distance - Current resisted pull distance.
 * @param threshold - Release threshold mapped to 100%.
 * @returns Normalized progress between 0 and 1.
 */
export function getRefreshProgress(
  distance: number,
  threshold: number = PULL_REFRESH_THRESHOLD,
): number {
  if (threshold <= 0) {
    return 0;
  }
  return Math.min(1, distance / threshold);
}
