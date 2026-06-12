import { describe, expect, it } from 'vitest';

import { COLOR_THEME_IDS, DEFAULT_COLOR_THEME_ID, normalizeColorThemeId } from './color-themes';

describe('normalizeColorThemeId', () => {
  it('returns the default for unknown values', () => {
    expect(normalizeColorThemeId(null)).toBe(DEFAULT_COLOR_THEME_ID);
    expect(normalizeColorThemeId('invalid')).toBe(DEFAULT_COLOR_THEME_ID);
  });

  it('accepts every defined theme id', () => {
    for (const id of COLOR_THEME_IDS) {
      expect(normalizeColorThemeId(id)).toBe(id);
    }
  });
});
