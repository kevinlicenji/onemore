import { describe, expect, it } from 'vitest';

import { getElapsedRestSeconds } from './rest-elapsed-seconds';

describe('getElapsedRestSeconds', () => {
  it('returns elapsed seconds when rest is skipped early', () => {
    const startedAt = 1_000;
    expect(getElapsedRestSeconds(startedAt, 120, 71_000)).toBe(70);
  });

  it('caps elapsed rest at the planned duration', () => {
    const startedAt = 0;
    expect(getElapsedRestSeconds(startedAt, 90, 120_000)).toBe(90);
  });
});
