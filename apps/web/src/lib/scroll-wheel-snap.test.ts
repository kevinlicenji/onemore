import { describe, expect, it } from 'vitest';

import {
  buildNumericWheelValues,
  clampWheelIndex,
  scrollTopForIndex,
  snapIndexFromScroll,
  wheelEdgePadding,
} from './scroll-wheel-snap';

describe('scroll-wheel-snap', () => {
  it('snaps scroll offset to index', () => {
    expect(snapIndexFromScroll(88, 44)).toBe(2);
    expect(scrollTopForIndex(2, 44)).toBe(88);
  });

  it('clamps wheel index', () => {
    expect(clampWheelIndex(-1, 5)).toBe(0);
    expect(clampWheelIndex(9, 5)).toBe(4);
  });

  it('builds weight values with 0.5 step', () => {
    expect(buildNumericWheelValues(0, 1, 0.5)).toEqual([0, 0.5, 1]);
  });

  it('centers workout wheel rows in the viewport', () => {
    expect(wheelEdgePadding(100, 28)).toBe(36);
    expect(wheelEdgePadding(118, 30)).toBe(44);
    expect(wheelEdgePadding(94, 26)).toBe(34);
  });
});
