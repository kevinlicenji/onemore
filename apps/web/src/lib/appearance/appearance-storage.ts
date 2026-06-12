import {
  DEFAULT_COLOR_THEME_ID,
  normalizeColorThemeId,
  type ColorThemeId,
} from './color-themes';
import { DEFAULT_FONT_ID, normalizeFontId, type FontId } from './font-options';

export const APPEARANCE_COLOR_THEME_KEY = 'onemore-appearance-color-theme';
export const APPEARANCE_FONT_KEY = 'onemore-appearance-font';

export interface AppearancePreferences {
  colorThemeId: ColorThemeId;
  fontId: FontId;
}

/**
 * @returns Defaults when storage is unavailable (SSR) or unset.
 */
export function getDefaultAppearancePreferences(): AppearancePreferences {
  return {
    colorThemeId: DEFAULT_COLOR_THEME_ID,
    fontId: DEFAULT_FONT_ID,
  };
}

/**
 * Reads appearance preferences from localStorage.
 *
 * @returns Parsed preferences or defaults when storage is empty/invalid.
 */
export function readAppearancePreferences(): AppearancePreferences {
  if (typeof window === 'undefined') {
    return getDefaultAppearancePreferences();
  }

  try {
    return {
      colorThemeId: normalizeColorThemeId(localStorage.getItem(APPEARANCE_COLOR_THEME_KEY)),
      fontId: normalizeFontId(localStorage.getItem(APPEARANCE_FONT_KEY)),
    };
  } catch {
    return getDefaultAppearancePreferences();
  }
}

/**
 * Persists appearance preferences to localStorage.
 *
 * @param preferences - Color theme and font selections.
 */
export function writeAppearancePreferences(preferences: AppearancePreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(APPEARANCE_COLOR_THEME_KEY, preferences.colorThemeId);
    localStorage.setItem(APPEARANCE_FONT_KEY, preferences.fontId);
  } catch {
    // Private browsing or blocked storage — preferences apply for session only.
  }
}
