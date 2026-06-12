import { describe, expect, it, vi } from 'vitest';

import { isIosSafari, isStandalonePwa } from './pwa-platform';

describe('pwa-platform', () => {
  it('detects iOS Safari when not standalone', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      standalone: false,
    });
    expect(isIosSafari()).toBe(true);
  });

  it('detects standalone display mode', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
    });
    vi.stubGlobal('navigator', { standalone: false });
    expect(isStandalonePwa()).toBe(true);
  });
});
