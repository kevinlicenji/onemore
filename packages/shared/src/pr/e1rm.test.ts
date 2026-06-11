import { describe, expect, it } from 'vitest';

import { computeE1rm, computeSetVolume, roundPrValue } from './e1rm.js';

describe('computeE1rm', () => {
  it('AC-e1RM-01: 100 kg × 5 reps → Epley e1RM ≈ 116.67 kg', () => {
    const result = computeE1rm(100, 5);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(116.67, 2);
  });

  it('AC-e1RM-02: reps = 0 or weight = 0 → no e1RM', () => {
    expect(computeE1rm(0, 5)).toBeNull();
    expect(computeE1rm(100, 0)).toBeNull();
  });

  it('AC-e1RM-03: reps > 15 → no e1RM', () => {
    expect(computeE1rm(100, 16)).toBeNull();
  });

  it('uses Brzycki for reps 11–15', () => {
    const result = computeE1rm(80, 12);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(80 * (36 / 25), 2);
  });
});

describe('computeSetVolume', () => {
  it('returns weight × reps for valid inputs', () => {
    expect(computeSetVolume(100, 5)).toBe(500);
  });

  it('returns null for zero weight or reps', () => {
    expect(computeSetVolume(0, 5)).toBeNull();
    expect(computeSetVolume(100, 0)).toBeNull();
  });
});

describe('roundPrValue', () => {
  it('rounds to two decimal places', () => {
    expect(roundPrValue(116.666666)).toBe(116.67);
  });
});
