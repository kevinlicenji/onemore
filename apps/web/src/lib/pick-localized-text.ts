import type { LocalizedText } from '@onemore/shared';

/**
 * Resolve localized copy for the active UI locale.
 *
 * @param text - Bilingual content.
 * @param locale - Active locale code.
 */
export function pickLocalizedText(text: LocalizedText | null | undefined, locale: string): string {
  if (!text) {
    return '';
  }
  if (locale === 'it' && text.it) {
    return text.it;
  }
  return text.en;
}
