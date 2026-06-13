import { z } from 'zod';

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  it: z.string().min(1).optional(),
});

export const templateMetaSchema = z.object({
  displayName: localizedTextSchema,
  audience: z.string().min(1),
  daysPerWeek: z.number().int().min(1).max(7),
  equipmentProfile: z
    .enum(['mixed', 'machines', 'free_weights', 'bodyweight', 'dumbbells', 'bands'])
    .optional(),
  split: z
    .enum(['full_body', 'upper_lower', 'push_pull_legs', 'bro_split', 'conditioning'])
    .optional(),
  tags: z.array(z.string()).optional(),
  /** Why the program is structured this way — target audience and training intent. */
  guide: localizedTextSchema,
  /** Short motivational hook for template cards. */
  tagline: localizedTextSchema.optional(),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type TemplateMeta = z.infer<typeof templateMetaSchema>;

/**
 * Pick localized copy with English fallback.
 *
 * @param text - Bilingual string object.
 * @param locale - Preferred locale code.
 */
export function pickLocalizedText(text: LocalizedText | undefined, locale: string): string | null {
  if (!text) {
    return null;
  }
  if (locale === 'it' && text.it) {
    return text.it;
  }
  return text.en;
}
