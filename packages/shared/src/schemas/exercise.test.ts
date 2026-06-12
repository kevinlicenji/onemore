import { describe, expect, it } from 'vitest';

import { createCustomExerciseSchema, exerciseSearchQuerySchema } from './exercise.js';

describe('exerciseSearchQuerySchema', () => {
  it('defaults limit to 25', () => {
    const result = exerciseSearchQuerySchema.parse({});
    expect(result.limit).toBe(25);
  });

  it('parses search query', () => {
    const result = exerciseSearchQuerySchema.parse({ q: 'bench', limit: 10 });
    expect(result.q).toBe('bench');
    expect(result.limit).toBe(10);
  });

  it('parses equipment and bodyweight filters', () => {
    const result = exerciseSearchQuerySchema.parse({
      category: 'chest',
      equipment: 'machine',
      isBodyweight: 'true',
      equipmentGroup: 'machines',
    });
    expect(result.category).toBe('chest');
    expect(result.equipment).toBe('machine');
    expect(result.isBodyweight).toBe(true);
    expect(result.equipmentGroup).toBe('machines');
  });

  it('parses muscle group filter', () => {
    const result = exerciseSearchQuerySchema.parse({ muscle: 'hamstrings' });
    expect(result.muscle).toBe('hamstrings');
  });
});

describe('createCustomExerciseSchema', () => {
  it('accepts valid custom exercise', () => {
    const result = createCustomExerciseSchema.parse({
      names: { en: 'My press' },
      category: 'chest',
      primaryMuscles: ['chest'],
      equipment: 'dumbbell',
    });
    expect(result.names.en).toBe('My press');
  });

  it('rejects empty primary muscles', () => {
    expect(() =>
      createCustomExerciseSchema.parse({
        names: { en: 'My press' },
        category: 'chest',
        primaryMuscles: [],
        equipment: 'dumbbell',
      }),
    ).toThrow();
  });
});
