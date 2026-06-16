import { getLocalDateKey, localDateKeyToUtcEnd, localDateKeyToUtcStart } from '@onemore/shared';

/**
 * Today's calendar date in the user's timezone (YYYY-MM-DD).
 */
export function getTodayDateKey(timezone: string): string {
  return getLocalDateKey(new Date(), timezone);
}

/**
 * UTC query bounds for supplement logs on a local calendar day.
 */
export function supplementLogRangeForDateKey(dateKey: string): { from: string; to: string } {
  return {
    from: localDateKeyToUtcStart(dateKey),
    to: localDateKeyToUtcEnd(dateKey),
  };
}

/**
 * ISO timestamp stored for a supplement log on a local day.
 */
export function supplementLogIsoForDateKey(dateKey: string): string {
  return localDateKeyToUtcStart(dateKey);
}
