import { describe, expect, it } from 'vitest';

import { onboardingCompleteSchema, onboardingUpdateSchema } from './onboarding.js';

describe('onboardingUpdateSchema', () => {
  it('accepts a single field update', () => {
    const result = onboardingUpdateSchema.parse({ trainingGoal: 'mass' });
    expect(result.trainingGoal).toBe('mass');
  });

  it('rejects empty payload', () => {
    expect(() => onboardingUpdateSchema.parse({})).toThrow();
  });

  it('rejects invalid motivation level', () => {
    expect(() => onboardingUpdateSchema.parse({ motivationLevel: 4 })).toThrow();
  });
});

describe('onboardingCompleteSchema', () => {
  it('accepts valid complete payload', () => {
    const result = onboardingCompleteSchema.parse({
      trainingGoal: 'strength',
      trainingLevel: 'beginner',
      trainingEnvironment: 'gym',
      trainingDaysPerWeek: 3,
      preferredSessionMinutes: 60,
      preferredMuscleGroups: ['chest', 'back'],
      motivationLevel: 2,
    });
    expect(result.trainingDaysPerWeek).toBe(3);
    expect(result.preferredSessionMinutes).toBe(60);
  });

  it('rejects missing fields', () => {
    expect(() =>
      onboardingCompleteSchema.parse({
        trainingGoal: 'fitness',
        trainingLevel: 'beginner',
      }),
    ).toThrow();
  });
});
