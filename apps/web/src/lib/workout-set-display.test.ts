import { describe, expect, it } from 'vitest';

import { formatPreviousSetLine } from './workout-set-display';

describe('formatPreviousSetLine', () => {
  it('formats weight and reps', () => {
    expect(formatPreviousSetLine(80, 10, 'Failure')).toBe('80 kg × 10');
  });

  it('returns null when both values are missing', () => {
    expect(formatPreviousSetLine(null, null, 'Failure')).toBeNull();
  });
});
