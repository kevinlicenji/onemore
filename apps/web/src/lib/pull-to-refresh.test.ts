import { describe, expect, it } from 'vitest';

import {
  calculatePullDistance,
  getRefreshProgress,
  PULL_REFRESH_MAX,
  PULL_REFRESH_THRESHOLD,
  shouldTriggerRefresh,
} from './pull-to-refresh';

describe('calculatePullDistance', () => {
  it('returns zero for upward or zero delta', () => {
    expect(calculatePullDistance(0)).toBe(0);
    expect(calculatePullDistance(-20)).toBe(0);
  });

  it('applies resistance and caps at max', () => {
    expect(calculatePullDistance(100)).toBe(45);
    expect(calculatePullDistance(300)).toBe(PULL_REFRESH_MAX);
  });
});

describe('shouldTriggerRefresh', () => {
  it('returns false below threshold', () => {
    expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD - 1)).toBe(false);
  });

  it('returns true at or above threshold', () => {
    expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD)).toBe(true);
    expect(shouldTriggerRefresh(PULL_REFRESH_THRESHOLD + 10)).toBe(true);
  });
});

describe('getRefreshProgress', () => {
  it('returns zero for no pull', () => {
    expect(getRefreshProgress(0)).toBe(0);
  });

  it('clamps progress at one', () => {
    expect(getRefreshProgress(PULL_REFRESH_THRESHOLD / 2)).toBe(0.5);
    expect(getRefreshProgress(PULL_REFRESH_THRESHOLD * 2)).toBe(1);
  });
});
