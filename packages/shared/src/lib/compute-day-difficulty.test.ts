import { describe, expect, it } from 'vitest';

import { TARGET_REPS_TO_FAILURE } from '../constants/reps-prescription.js';
import { computeDayDifficulty, resolveDayDifficulty } from './compute-day-difficulty.js';

describe('computeDayDifficulty', () => {
  it('returns easy for light beginner prescriptions', () => {
    const level = computeDayDifficulty([
      { targetSets: 2, targetReps: 8, restSeconds: 120 },
      { targetSets: 2, targetReps: 10, restSeconds: 120 },
    ]);
    expect(level).toBe(1);
  });

  it('returns hard for dense high-volume days', () => {
    const level = computeDayDifficulty([
      { targetSets: 5, targetReps: 12, restSeconds: 45 },
      { targetSets: 4, targetReps: 10, restSeconds: 60 },
      { targetSets: 4, targetReps: TARGET_REPS_TO_FAILURE, restSeconds: 90 },
      { targetSets: 3, targetReps: 15, restSeconds: 60 },
    ]);
    expect(level).toBe(3);
  });

  it('prefers stored level when provided', () => {
    expect(resolveDayDifficulty([{ targetSets: 2, targetReps: 8, restSeconds: 120 }], 3)).toBe(3);
  });
});
