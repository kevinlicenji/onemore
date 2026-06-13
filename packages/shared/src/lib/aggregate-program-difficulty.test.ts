import { describe, expect, it } from 'vitest';

import { aggregateProgramDifficulty } from './aggregate-program-difficulty.js';

describe('aggregateProgramDifficulty', () => {
  it('returns max day level', () => {
    expect(aggregateProgramDifficulty([1, 2, 3, 1])).toBe(3);
  });

  it('defaults to medium when no days', () => {
    expect(aggregateProgramDifficulty([])).toBe(2);
  });
});
