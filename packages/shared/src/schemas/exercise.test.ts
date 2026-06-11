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
