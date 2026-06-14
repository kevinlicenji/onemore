/**
 * ISO week helpers using the user's IANA timezone (Monday week start).
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

/**
 * Return the ISO week key immediately before the given key.
 *
 * @param weekKey - Current ISO week key (YYYY-Www).
 */
export function getPreviousIsoWeekKey(weekKey: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) {
    return weekKey;
  }

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week > 1) {
    return `${String(year)}-W${String(week - 1).padStart(2, '0')}`;
  }

  const prevYearLastWeek = getIsoWeeksInYear(year - 1);
  return `${String(year - 1)}-W${String(prevYearLastWeek).padStart(2, '0')}`;
}

/**
 * Count ISO weeks in a calendar year (for week-key rollover).
 *
 * @param year - Four-digit calendar year.
 */
export function getIsoWeeksInYear(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const day = dec28.getUTCDay() || 7;
  dec28.setUTCDate(dec28.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dec28.getUTCFullYear(), 0, 1));
  return Math.ceil(((dec28.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/**
 * Local calendar date key (YYYY-MM-DD) in the user's timezone.
 *
 * @param date - Instant to format.
 * @param timezone - IANA timezone id.
 */
export function getLocalDateKey(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * ISO weekday (1 = Monday … 7 = Sunday) for a date in the user's timezone.
 *
 * @param date - Instant to evaluate.
 * @param timezone - IANA timezone id.
 */
export function getLocalIsoWeekday(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const short = formatter.format(date);
  const dayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return dayMap[short] ?? 1;
}
