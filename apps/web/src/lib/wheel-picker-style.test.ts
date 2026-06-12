import { describe, expect, it } from 'vitest';

import { getWheelItemStyle } from './wheel-picker-style';

describe('getWheelItemStyle', () => {
  it('emphasizes the centered item', () => {
    const center = getWheelItemStyle(0);
    const edge = getWheelItemStyle(3);
    expect(center.fontSizeRem).toBeGreaterThan(edge.fontSizeRem);
    expect(center.opacity).toBeGreaterThan(edge.opacity);
    expect(center.fontWeight).toBe(700);
  });
});
