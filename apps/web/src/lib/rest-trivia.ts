import { REST_TRIVIA_ITEMS } from '@/data/rest-trivia';

/**
 * Pick a random rest-trivia line for the given locale.
 *
 * @param locale - App locale (`it` or `en`).
 */
export function pickRestTrivia(locale: string): string {
  const index = Math.floor(Math.random() * REST_TRIVIA_ITEMS.length);
  const item = REST_TRIVIA_ITEMS[index];
  if (!item) {
    return '';
  }
  return locale === 'it' ? item.it : item.en;
}
