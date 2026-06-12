import type { ColorThemeId } from './color-themes';
import { DEFAULT_COLOR_THEME_ID } from './color-themes';
import type { FontId } from './font-options';
import { DEFAULT_FONT_ID } from './font-options';

export const APPEARANCE_COLOR_ATTR = 'data-color-theme';
export const APPEARANCE_FONT_ATTR = 'data-font';

export interface AppearanceAttributes {
  colorThemeId: ColorThemeId;
  fontId: FontId;
}

/**
 * Builds DOM attributes for the active appearance preferences.
 *
 * @param preferences - Selected color theme and font.
 * @returns Attribute map for `<html>`.
 */
export function buildAppearanceAttributes(preferences: AppearanceAttributes): Record<string, string> {
  return {
    [APPEARANCE_COLOR_ATTR]: preferences.colorThemeId,
    [APPEARANCE_FONT_ATTR]: preferences.fontId,
  };
}

/**
 * Applies appearance attributes on the document root element.
 *
 * @param preferences - Selected color theme and font.
 */
export function applyAppearanceToDocument(preferences: AppearanceAttributes): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.setAttribute(APPEARANCE_COLOR_ATTR, preferences.colorThemeId);
  root.setAttribute(APPEARANCE_FONT_ATTR, preferences.fontId);
}

/**
 * @returns Inline script that restores appearance before first paint.
 */
export function buildAppearanceInitScript(): string {
  const colorKey = 'onemore-appearance-color-theme';
  const fontKey = 'onemore-appearance-font';
  const defaultColor = DEFAULT_COLOR_THEME_ID;
  const defaultFont = DEFAULT_FONT_ID;

  return `(function(){try{var r=document.documentElement;var c=localStorage.getItem('${colorKey}');var f=localStorage.getItem('${fontKey}');r.setAttribute('${APPEARANCE_COLOR_ATTR}',c||'${defaultColor}');r.setAttribute('${APPEARANCE_FONT_ATTR}',f||'${defaultFont}');}catch(e){}})();`;
}
