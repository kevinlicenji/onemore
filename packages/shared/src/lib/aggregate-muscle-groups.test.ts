import { describe, expect, it } from 'vitest';

import { normalizeMuscleTags } from '../constants/muscle-groups.js';
import { aggregateMuscleGroups, formatMuscleGroupLabels } from './aggregate-muscle-groups.js';

describe('aggregateMuscleGroups', () => {
  it('aggregates unique tags in display order', () => {
    const result = aggregateMuscleGroups([
      { primaryMuscles: ['back', 'shoulders'] },
      { primaryMuscles: ['biceps'] },
      { primaryMuscles: ['back'] },
    ]);
    expect(result).toEqual(['back', 'shoulders', 'biceps']);
  });

  it('normalizes legacy muscle slugs', () => {
    expect(normalizeMuscleTags(['legs', 'quads'])).toEqual(['quadriceps']);
  });
});

describe('formatMuscleGroupLabels', () => {
  it('formats localized labels', () => {
    const labels = {
      chest: 'Petto',
      back: 'Schiena',
      lower_back: 'Lombari',
      traps: 'Trapezi',
      shoulders: 'Spalle',
      biceps: 'Bicipiti',
      triceps: 'Tricipiti',
      forearms: 'Avambracci',
      quadriceps: 'Quadricipiti',
      hamstrings: 'Femorali',
      glutes: 'Glutei',
      calves: 'Polpacci',
      adductors: 'Adduttori',
      abductors: 'Abduttori',
      core: 'Core',
      cardio: 'Cardio',
      full_body: 'Full body',
    };
    expect(formatMuscleGroupLabels(['biceps', 'back'], labels)).toBe('Schiena, Bicipiti');
  });
});
