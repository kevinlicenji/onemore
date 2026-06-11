/**
 * ISO week helpers using the user's IANA timezone (Monday week start per Algorithm Spec §5.4).
 */

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Extract calendar date parts in the given timezone.
 *
 * @param date - Instant to convert.
 * @param timezone - IANA timezone id.
 */
function getLocalDateParts(date: Date, timezone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '1970');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
  return { year, month, day };
}

/**
 * ISO week key (YYYY-Www) for a date in the user's timezone.
 *
 * @param date - Instant to bucket.
 * @param timezone - IANA timezone id.
 */
export function getIsoWeekKey(date: Date, timezone: string): string {
  const { year, month, day } = getLocalDateParts(date, timezone);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayOfWeek);
  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const weekNumber = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${String(isoYear)}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * ISO week key for "now" in the user's timezone.
 *
 * @param timezone - IANA timezone id.
 */
export function getCurrentIsoWeekKey(timezone: string): string {
  return getIsoWeekKey(new Date(), timezone);
}
