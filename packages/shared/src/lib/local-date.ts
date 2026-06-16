/**
 * Helpers for user-local calendar dates stored as UTC midnight instants.
 */

/**
 * Start-of-day ISO timestamp for a local date key (YYYY-MM-DD).
 *
 * @param dateKey - Local calendar date.
 */
export function localDateKeyToUtcStart(dateKey: string): string {
  return `${dateKey}T00:00:00.000Z`;
}

/**
 * End-of-day ISO timestamp for a local date key (YYYY-MM-DD).
 *
 * @param dateKey - Local calendar date.
 */
export function localDateKeyToUtcEnd(dateKey: string): string {
  return `${dateKey}T23:59:59.999Z`;
}
