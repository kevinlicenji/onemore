import { describe, expect, it } from 'vitest';

import {
  formatTargetRepsLabel,
  isFailureReps,
  TARGET_REPS_TO_FAILURE,
} from './reps-prescription.js';

describe('reps-prescription', () => {
  it('detects failure reps', () => {
    expect(isFailureReps(TARGET_REPS_TO_FAILURE)).toBe(true);
    expect(isFailureReps(10)).toBe(false);
  });

  it('formats failure label', () => {
    expect(formatTargetRepsLabel(8, 'Cedimento')).toBe('8');
    expect(formatTargetRepsLabel(TARGET_REPS_TO_FAILURE, 'Cedimento')).toBe('Cedimento');
  });
});
