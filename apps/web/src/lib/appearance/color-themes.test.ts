import { describe, expect, it } from 'vitest';

import { normalizeColorThemeId } from './color-themes';

describe('normalizeColorThemeId', () => {
  it('returns valid theme ids unchanged', () => {
    expect(normalizeColorThemeId('solar')).toBe('solar');
  });

  it('maps legacy theme ids to the new palette', () => {
    expect(normalizeColorThemeId('ocean')).toBe('classic');
    expect(normalizeColorThemeId('pulse')).toBe('ember');
  });

  it('falls back to classic for unknown values', () => {
    expect(normalizeColorThemeId('invalid')).toBe('classic');
    expect(normalizeColorThemeId(null)).toBe('classic');
  });
});
