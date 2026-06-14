import { describe, expect, it } from 'vitest';

import { canCompleteWorkoutSet } from './can-complete-workout-set';

describe('canCompleteWorkoutSet', () => {
  it('allows completion when reps are positive', () => {
    expect(canCompleteWorkoutSet(8)).toBe(true);
    expect(canCompleteWorkoutSet(1)).toBe(true);
  });

  it('blocks completion when reps are zero or missing', () => {
    expect(canCompleteWorkoutSet(0)).toBe(false);
    expect(canCompleteWorkoutSet(null)).toBe(false);
  });
});
