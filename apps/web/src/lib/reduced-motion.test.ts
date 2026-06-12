import { afterEach, describe, expect, it, vi } from 'vitest';

import { prefersReducedMotion, REDUCED_MOTION_MEDIA } from './reduced-motion';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prefersReducedMotion', () => {
  it('returns false when reduced motion is not preferred', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === REDUCED_MOTION_MEDIA ? false : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns true when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      media: REDUCED_MOTION_MEDIA,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    expect(prefersReducedMotion()).toBe(true);
  });
});
