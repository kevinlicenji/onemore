/**
 * Default workout day label for program builders (1-based index).
 *
 * @param dayIndex - Zero-based day index.
 * @param locale - Active UI locale.
 */
export function defaultWorkoutDayLabel(dayIndex: number, locale: string): string {
  const dayNumber = dayIndex + 1;
  return locale.startsWith('it') ? `Giorno ${String(dayNumber)}` : `Day ${String(dayNumber)}`;
}

/**
 * Localize stored workout day labels and normalize legacy template names.
 *
 * @param label - Stored day label from DB or builder.
 * @param locale - Active UI locale.
 */
export function localizeWorkoutDayLabel(label: string, locale: string): string {
  const giornoMatch = /^Giorno (\d+)$/.exec(label);
  if (giornoMatch) {
    return locale.startsWith('it') ? label : `Day ${giornoMatch[1] ?? '1'}`;
  }

  const dayNumberMatch = /^Day (\d+)$/.exec(label);
  if (dayNumberMatch) {
    return locale.startsWith('it') ? `Giorno ${dayNumberMatch[1] ?? '1'}` : label;
  }

  const legacyLetterMatch = /^Day ([A-Z])$/i.exec(label);
  if (legacyLetterMatch) {
    const letter = legacyLetterMatch[1]?.toUpperCase() ?? 'A';
    const dayIndex = letter.charCodeAt(0) - 65;
    return defaultWorkoutDayLabel(dayIndex, locale);
  }

  const upperLowerMatch = /^(Upper|Lower)\s*([AB])$/i.exec(label);
  if (upperLowerMatch) {
    const isUpper = upperLowerMatch[1]?.toLowerCase() === 'upper';
    const isA = upperLowerMatch[2]?.toUpperCase() === 'A';
    const dayIndex = isUpper ? (isA ? 0 : 2) : isA ? 1 : 3;
    return defaultWorkoutDayLabel(dayIndex, locale);
  }

  const splitMatch = /^(Push|Pull|Legs)$/i.exec(label);
  if (splitMatch) {
    const splitIndex =
      splitMatch[1]?.toLowerCase() === 'push' ? 0 : splitMatch[1]?.toLowerCase() === 'pull' ? 1 : 2;
    return defaultWorkoutDayLabel(splitIndex, locale);
  }

  return label;
}
