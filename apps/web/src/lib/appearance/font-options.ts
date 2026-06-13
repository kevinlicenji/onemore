/**
 * User-selectable app fonts applied via `data-font` on `<html>`.
 */
export const FONT_IDS = [
  'plus-jakarta',
  'inter',
  'dm-sans',
  'outfit',
  'bebas-neue',
  'oswald',
  'rubik',
  'barlow',
  'space-grotesk',
  'system',
] as const;

export type FontId = (typeof FONT_IDS)[number];

export const DEFAULT_FONT_ID: FontId = 'plus-jakarta';

export interface FontOptionDefinition {
  id: FontId;
  /** CSS `font-family` stack used for the settings preview label. */
  previewFamily: string;
}

export const FONT_OPTIONS: FontOptionDefinition[] = [
  {
    id: 'plus-jakarta',
    previewFamily: 'var(--font-plus-jakarta), system-ui, sans-serif',
  },
  {
    id: 'inter',
    previewFamily: 'var(--font-inter), system-ui, sans-serif',
  },
  {
    id: 'dm-sans',
    previewFamily: 'var(--font-dm-sans), system-ui, sans-serif',
  },
  {
    id: 'outfit',
    previewFamily: 'var(--font-outfit), system-ui, sans-serif',
  },
  {
    id: 'bebas-neue',
    previewFamily: 'var(--font-bebas-neue), system-ui, sans-serif',
  },
  {
    id: 'oswald',
    previewFamily: 'var(--font-oswald), system-ui, sans-serif',
  },
  {
    id: 'rubik',
    previewFamily: 'var(--font-rubik), system-ui, sans-serif',
  },
  {
    id: 'barlow',
    previewFamily: 'var(--font-barlow), system-ui, sans-serif',
  },
  {
    id: 'space-grotesk',
    previewFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  },
  {
    id: 'system',
    previewFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
  },
];

/**
 * @param value - Raw stored preference.
 * @returns A valid font id or the default.
 */
export function normalizeFontId(value: string | null | undefined): FontId {
  if (value && (FONT_IDS as readonly string[]).includes(value)) {
    return value as FontId;
  }
  return DEFAULT_FONT_ID;
}
