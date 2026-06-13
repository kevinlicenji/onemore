import type { TemplateSummary } from '@onemore/shared';
import { pickLocalizedText } from '@onemore/shared';

/**
 * Resolves the primary title shown on template cards.
 */
export function templateCardTitle(template: TemplateSummary, locale: string): string {
  if (locale === 'it' && template.description) {
    return template.description;
  }
  return template.name;
}

/**
 * Resolves the short motivational line for template cards.
 */
export function templateCardTagline(template: TemplateSummary, locale: string): string {
  const tagline = pickLocalizedText(template.tagline ?? undefined, locale);
  if (tagline) {
    return tagline;
  }

  const guide = pickLocalizedText(template.guide ?? undefined, locale);
  if (!guide) {
    return '';
  }

  const firstSentence = guide.split(/[.!?]/)[0]?.trim() ?? guide;
  return firstSentence.length > 72 ? `${firstSentence.slice(0, 69)}…` : firstSentence;
}
