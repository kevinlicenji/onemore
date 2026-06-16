import { describe, expect, it } from 'vitest';

import { buildWeightWheelValuesAround } from './metric-picker-config';

describe('buildWeightWheelValuesAround', () => {
  it('returns a bounded wheel around the center weight', () => {
    const values = buildWeightWheelValuesAround(100, 20);
    expect(values[0]).toBe(80);
    expect(values[values.length - 1]).toBe(120);
    expect(values).toContain(100);
    expect(values.length).toBeLessThan(200);
  });
});
