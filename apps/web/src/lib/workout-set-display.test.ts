import { describe, expect, it } from 'vitest';

import { TARGET_REPS_TO_FAILURE } from '@onemore/shared';

import {
  formatLoggedSetLine,
  formatPrescribedWeight,
  formatSetPrescriptionLine,
  isExtraSet,
} from './workout-set-display';

describe('workout-set-display', () => {
  it('formats prescribed weight', () => {
    expect(formatPrescribedWeight(60)).toBe('60');
    expect(formatPrescribedWeight(null)).toBe('—');
  });

  it('formats prescription line', () => {
    expect(formatSetPrescriptionLine(10, 60, 90)).toBe("10 x 60kg (90')");
    expect(formatSetPrescriptionLine(8, null, 60)).toBe("8 x — (60')");
    expect(formatSetPrescriptionLine(TARGET_REPS_TO_FAILURE, 40, 90, 'Cedimento')).toBe(
      "Cedimento x 40kg (90')",
    );
  });

  it('formats logged set line', () => {
    expect(formatLoggedSetLine(10, 60, 75, 8)).toBe("10 x 60kg (75')");
    expect(formatLoggedSetLine(null, null, null, 8)).toBe('8 x —');
  });

  it('detects extra sets', () => {
    expect(isExtraSet(4, 3)).toBe(true);
    expect(isExtraSet(3, 3)).toBe(false);
  });
});
