/**
 * Convert display text into a URL-safe slug.
 *
 * @param value - Source text.
 * @returns Lowercase hyphenated slug.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
