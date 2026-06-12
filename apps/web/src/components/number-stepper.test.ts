import { describe, expect, it } from 'vitest';

/**
 * Step rounding helper mirrored from NumberStepper behavior.
 */
function roundToStep(value: number, step: number): number {
  const steps = Math.round((value + Number.EPSILON) / step);
  const decimals = step % 1 === 0 ? 0 : 1;
  return Number((steps * step).toFixed(decimals));
}

describe('NumberStepper rounding', () => {
  it('rounds weight steps to 2.5 kg', () => {
    expect(roundToStep(62.3, 2.5)).toBe(62.5);
    expect(roundToStep(60, 2.5)).toBe(60);
  });

  it('rounds rep steps to whole numbers', () => {
    expect(roundToStep(9.4, 1)).toBe(9);
    expect(roundToStep(9.6, 1)).toBe(10);
  });
});
