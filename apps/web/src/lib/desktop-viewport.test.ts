import { describe, expect, it } from 'vitest';

import { DESKTOP_MEDIA, DESKTOP_MIN_WIDTH_PX, isDesktopViewport } from './desktop-viewport';

describe('desktop-viewport', () => {
  it('uses the lg Tailwind breakpoint', () => {
    expect(DESKTOP_MIN_WIDTH_PX).toBe(1024);
    expect(DESKTOP_MEDIA).toBe('(min-width: 1024px)');
  });

  it('maps matchMedia result to desktop mode', () => {
    expect(isDesktopViewport(true)).toBe(true);
    expect(isDesktopViewport(false)).toBe(false);
  });
});
