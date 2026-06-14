import { describe, expect, it } from 'vitest';

import { getExerciseDisplayName, sortExercisesByDisplayName } from './exercise-display-name';

describe('getExerciseDisplayName', () => {
  it('returns Italian name when locale is it and translation exists', () => {
    expect(getExerciseDisplayName({ names: { en: 'Bench Press', it: 'Panca piana' } }, 'it')).toBe(
      'Panca piana',
    );
  });

  it('falls back to English when Italian is missing', () => {
    expect(getExerciseDisplayName({ names: { en: 'Bench Press' } }, 'it')).toBe('Bench Press');
  });
});

describe('sortExercisesByDisplayName', () => {
  it('sorts exercises alphabetically by localized display name', () => {
    const exercises = [
      {
        id: '2',
        slug: 'squat',
        names: { en: 'Squat', it: 'Squat' },
        category: 'legs',
        primaryMuscles: ['quadriceps'] as const,
        secondaryMuscles: [],
        equipment: 'barbell',
        isBodyweight: false,
        isCustom: false,
      },
      {
        id: '1',
        slug: 'bench-press',
        names: { en: 'Bench Press', it: 'Panca piana' },
        category: 'chest',
        primaryMuscles: ['chest'] as const,
        secondaryMuscles: [],
        equipment: 'barbell',
        isBodyweight: false,
        isCustom: false,
      },
    ];

    const sorted = sortExercisesByDisplayName(exercises, 'it');
    expect(sorted.map((exercise) => getExerciseDisplayName(exercise, 'it'))).toEqual([
      'Panca piana',
      'Squat',
    ]);
  });
});
