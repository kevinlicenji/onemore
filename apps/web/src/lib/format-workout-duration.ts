/**
 * @param startedAt - ISO timestamp when the workout started.
 * @param nowMs - Current time in milliseconds.
 * @returns Elapsed seconds since workout start.
 */
export function getWorkoutElapsedSeconds(startedAt: string, nowMs: number = Date.now()): number {
  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) {
    return 0;
  }
  return Math.max(0, Math.floor((nowMs - startedMs) / 1000));
}

/**
 * @param seconds - Duration in seconds.
 * @returns Human-readable duration such as `42m` or `1h 5m`.
 */
export function formatWorkoutDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return secs > 0 || minutes === 0 ? `${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }
  return `${secs}s`;
}
