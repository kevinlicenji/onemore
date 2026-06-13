/**
 * User-selectable full appearance presets applied via `data-color-theme` on `<html>`.
 * Each preset defines background, foreground, and accent contrast — not only primary hue.
 */
export const COLOR_THEME_IDS = ['classic', 'solar', 'midnight', 'forest', 'ember'] as const;

export type ColorThemeId = (typeof COLOR_THEME_IDS)[number];

export const DEFAULT_COLOR_THEME_ID: ColorThemeId = 'classic';

const LEGACY_COLOR_THEME_MAP: Record<string, ColorThemeId> = {
  ocean: 'classic',
  arctic: 'solar',
  cobalt: 'forest',
  pulse: 'ember',
};

export interface ColorThemeDefinition {
  id: ColorThemeId;
  /** Primary swatch hex for the picker. */
  swatch: string;
  /** Secondary accent swatch hex. */
  accentSwatch: string;
  /** Page background preview hex. */
  backgroundSwatch: string;
}

export const COLOR_THEMES: ColorThemeDefinition[] = [
  { id: 'classic', swatch: '#171717', accentSwatch: '#525252', backgroundSwatch: '#ffffff' },
  { id: 'solar', swatch: '#1d4ed8', accentSwatch: '#ca8a04', backgroundSwatch: '#fffbeb' },
  { id: 'midnight', swatch: '#3b82f6', accentSwatch: '#38bdf8', backgroundSwatch: '#0b1220' },
  { id: 'forest', swatch: '#15803d', accentSwatch: '#65a30d', backgroundSwatch: '#f3faf5' },
  { id: 'ember', swatch: '#ea580c', accentSwatch: '#fbbf24', backgroundSwatch: '#1c1410' },
];

/**
 * @param value - Raw stored preference.
 * @returns A valid color theme id or the default.
 */
export function normalizeColorThemeId(value: string | null | undefined): ColorThemeId {
  if (value && (COLOR_THEME_IDS as readonly string[]).includes(value)) {
    return value as ColorThemeId;
  }
  if (value && value in LEGACY_COLOR_THEME_MAP) {
    return LEGACY_COLOR_THEME_MAP[value] as ColorThemeId;
  }
  return DEFAULT_COLOR_THEME_ID;
}
