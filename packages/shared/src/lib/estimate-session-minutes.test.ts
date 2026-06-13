import { describe, expect, it } from 'vitest';

import { estimateSessionMinutes, estimateSetWorkSeconds } from './estimate-session-minutes.js';

describe('estimateSetWorkSeconds', () => {
  it('treats high rep counts as timed holds', () => {
    expect(estimateSetWorkSeconds(45)).toBe(45);
  });

  it('estimates rep-based work time', () => {
    expect(estimateSetWorkSeconds(10)).toBe(30);
  });
});

describe('estimateSessionMinutes', () => {
  it('returns a bounded estimate for a typical gym day', () => {
    const minutes = estimateSessionMinutes([
      { targetSets: 3, targetReps: 8, restSeconds: 90 },
      { targetSets: 3, targetReps: 10, restSeconds: 90 },
      { targetSets: 3, targetReps: 10, restSeconds: 60 },
      { targetSets: 3, targetReps: 12, restSeconds: 60 },
    ]);

    expect(minutes).toBeGreaterThanOrEqual(25);
    expect(minutes).toBeLessThanOrEqual(90);
  });

  it('falls back to minimum when no exercises are provided', () => {
    expect(estimateSessionMinutes([])).toBe(15);
  });
});
