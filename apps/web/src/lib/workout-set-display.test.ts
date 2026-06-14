import { describe, expect, it } from 'vitest';

import { formatLastExecutionLine, formatSetTargetInline } from './workout-set-display';

describe('formatSetTargetInline', () => {
  it('formats sets, reps, weight and rest', () => {
    expect(formatSetTargetInline(5, 15, 70, 90, 'Failure')).toBe("5 x 15 x 70kg (90')");
  });
});

describe('formatLastExecutionLine', () => {
  it('formats last execution summary', () => {
    expect(formatLastExecutionLine(3, 10, 70, 'Failure')).toBe('3 x 10 x 70kg');
  });

  it('returns null when sets count is zero', () => {
    expect(formatLastExecutionLine(0, 10, 70, 'Failure')).toBeNull();
  });
});
