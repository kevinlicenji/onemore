import { describe, expect, it } from 'vitest';

import { DEFAULT_FONT_ID, FONT_IDS, normalizeFontId } from './font-options';

describe('normalizeFontId', () => {
  it('returns the default for unknown values', () => {
    expect(normalizeFontId(undefined)).toBe(DEFAULT_FONT_ID);
    expect(normalizeFontId('comic-sans')).toBe(DEFAULT_FONT_ID);
  });

  it('accepts every defined font id', () => {
    for (const id of FONT_IDS) {
      expect(normalizeFontId(id)).toBe(id);
    }
  });
});
