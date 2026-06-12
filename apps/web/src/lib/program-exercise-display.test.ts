import { TARGET_REPS_TO_FAILURE } from '@onemore/shared';
import { describe, expect, it } from 'vitest';

import { formatProgramExerciseSummary } from './program-exercise-display';

describe('formatProgramExerciseSummary', () => {
  it('formats sets, reps, weight and rest', () => {
    expect(formatProgramExerciseSummary(3, 8, 25, 90, 'Cedimento')).toBe(
      "3 x 8 x 25 kg (90')",
    );
  });

  it('formats failure reps', () => {
    expect(formatProgramExerciseSummary(4, TARGET_REPS_TO_FAILURE, 60, 120, 'Cedimento')).toBe(
      "4 x Cedimento x 60 kg (120')",
    );
  });
});
