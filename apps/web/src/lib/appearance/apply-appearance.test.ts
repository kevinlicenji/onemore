import { describe, expect, it } from 'vitest';

import {
  APPEARANCE_COLOR_ATTR,
  APPEARANCE_FONT_ATTR,
  buildAppearanceAttributes,
  buildAppearanceInitScript,
} from './apply-appearance';

describe('buildAppearanceAttributes', () => {
  it('maps preferences to html data attributes', () => {
    expect(buildAppearanceAttributes({ colorThemeId: 'arctic', fontId: 'outfit' })).toEqual({
      'data-color-theme': 'arctic',
      'data-font': 'outfit',
    });
  });
});

describe('buildAppearanceInitScript', () => {
  it('includes attribute keys and defaults', () => {
    const script = buildAppearanceInitScript();
    expect(script).toContain(APPEARANCE_COLOR_ATTR);
    expect(script).toContain(APPEARANCE_FONT_ATTR);
    expect(script).toContain('ocean');
    expect(script).toContain('plus-jakarta');
  });
});
