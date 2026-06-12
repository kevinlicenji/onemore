import { describe, expect, it } from 'vitest';

import { formatWorkoutDuration, getWorkoutElapsedSeconds } from './format-workout-duration';

describe('getWorkoutElapsedSeconds', () => {
  it('returns elapsed seconds from ISO start time', () => {
    const startedAt = '2026-06-01T10:00:00.000Z';
    const nowMs = Date.parse('2026-06-01T10:42:30.000Z');
    expect(getWorkoutElapsedSeconds(startedAt, nowMs)).toBe(2550);
  });

  it('returns zero for invalid timestamps', () => {
    expect(getWorkoutElapsedSeconds('invalid', Date.now())).toBe(0);
  });
});

describe('formatWorkoutDuration', () => {
  it('formats sub-hour durations', () => {
    expect(formatWorkoutDuration(125)).toBe('2m 5s');
    expect(formatWorkoutDuration(60)).toBe('1m');
  });

  it('formats hour-long durations', () => {
    expect(formatWorkoutDuration(3665)).toBe('1h 1m');
  });
});
