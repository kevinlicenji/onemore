/**
 * User-selectable color palettes applied via `data-color-theme` on `<html>`.
 */
export const COLOR_THEME_IDS = ['ocean', 'midnight', 'arctic', 'cobalt', 'pulse'] as const;

export type ColorThemeId = (typeof COLOR_THEME_IDS)[number];

export const DEFAULT_COLOR_THEME_ID: ColorThemeId = 'ocean';

export interface ColorThemeDefinition {
  id: ColorThemeId;
  /** Hex swatch shown in settings (light-mode primary). */
  swatch: string;
}

export const COLOR_THEMES: ColorThemeDefinition[] = [
  { id: 'ocean', swatch: '#1d4fd8' },
  { id: 'midnight', swatch: '#1e3a8a' },
  { id: 'arctic', swatch: '#0284c7' },
  { id: 'cobalt', swatch: '#1e40af' },
  { id: 'pulse', swatch: '#2563eb' },
];

/**
 * @param value - Raw stored preference.
 * @returns A valid color theme id or the default.
 */
export function normalizeColorThemeId(value: string | null | undefined): ColorThemeId {
  if (value && (COLOR_THEME_IDS as readonly string[]).includes(value)) {
    return value as ColorThemeId;
  }
  return DEFAULT_COLOR_THEME_ID;
}
