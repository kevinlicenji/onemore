import { describe, expect, it } from 'vitest';

import { getExerciseDisplayName } from './exercise-display-name';

describe('getExerciseDisplayName', () => {
  it('returns Italian name when locale is it and translation exists', () => {
    expect(
      getExerciseDisplayName({ names: { en: 'Bench Press', it: 'Panca piana' } }, 'it'),
    ).toBe('Panca piana');
  });

  it('falls back to English when Italian is missing', () => {
    expect(getExerciseDisplayName({ names: { en: 'Bench Press' } }, 'it')).toBe('Bench Press');
  });
});
