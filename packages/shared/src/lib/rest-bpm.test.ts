import { describe, expect, it } from 'vitest';

import {
  RESTING_BPM,
  computePeakBpm,
  computePulseDurationSeconds,
  computeRecoveryBpm,
} from './rest-bpm.js';

describe('computePeakBpm', () => {
  it('defaults to 150 BPM when RPE is not tracked', () => {
    expect(computePeakBpm(null)).toBe(150);
    expect(computePeakBpm(undefined)).toBe(150);
  });

  it('maps RPE tiers to peak BPM', () => {
    expect(computePeakBpm(10)).toBe(160);
    expect(computePeakBpm(9)).toBe(160);
    expect(computePeakBpm(8)).toBe(140);
    expect(computePeakBpm(7)).toBe(140);
    expect(computePeakBpm(6)).toBe(130);
  });
});

describe('computeRecoveryBpm', () => {
  it('starts at peak BPM when timer just began', () => {
    expect(computeRecoveryBpm(160, 90, 90)).toBe(160);
  });

  it('reaches resting BPM when timer completes', () => {
    expect(computeRecoveryBpm(160, 0, 90, RESTING_BPM)).toBe(RESTING_BPM);
  });

  it('decays linearly at the midpoint', () => {
    const midpoint = computeRecoveryBpm(160, 45, 90, RESTING_BPM);
    expect(midpoint).toBeGreaterThan(RESTING_BPM);
    expect(midpoint).toBeLessThan(160);
  });
});

describe('computePulseDurationSeconds', () => {
  it('returns 0.5s per beat at 120 BPM', () => {
    expect(computePulseDurationSeconds(120)).toBeCloseTo(0.5, 2);
  });

  it('clamps very low BPM for animation safety', () => {
    expect(computePulseDurationSeconds(10)).toBeCloseTo(1.5, 2);
  });
});
