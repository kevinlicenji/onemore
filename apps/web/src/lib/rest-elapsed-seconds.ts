/**
 * Elapsed rest seconds since a timer started, capped to the planned duration.
 */
export function getElapsedRestSeconds(
  startedAtMs: number,
  plannedSeconds: number,
  nowMs: number = Date.now(),
): number {
  const elapsed = Math.round((nowMs - startedAtMs) / 1000);
  return Math.max(1, Math.min(plannedSeconds, elapsed));
}
