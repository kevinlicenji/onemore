import { describe, expect, it } from 'vitest';

import { userProfileSchema } from './user.js';

describe('userProfileSchema', () => {
  const validProfile = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'athlete@example.com',
    emailVerifiedAt: null,
    displayName: 'Athlete',
    firstName: 'Marco',
    lastName: 'Rossi',
    username: 'athlete_one',
    locale: 'it' as const,
    birthYear: 1995,
    heightCm: 180,
    weightKg: 75,
    timezone: 'Europe/Rome',
    motivationLevel: 2,
    onboardingCompletedAt: null,
    trainingGoal: 'strength' as const,
    trainingLevel: 'intermediate' as const,
    trainingEnvironment: 'gym' as const,
    trainingDaysPerWeek: 4,
    preferredSessionMinutes: 60,
    preferredMuscleGroups: ['chest'],
    isCoach: false,
    mfaEnabled: false,
    settings: {
      units: 'metric' as const,
      notifications: {
        workoutReminders: true,
        progressUpdates: true,
        prCelebrations: true,
        quietHoursStart: null,
        quietHoursEnd: null,
      },
    },
    createdAt: '2026-06-10T12:00:00.000Z',
    updatedAt: '2026-06-10T12:00:00.000Z',
  };

  it('accepts a valid user profile', () => {
    expect(userProfileSchema.parse(validProfile)).toEqual(validProfile);
  });

  it('rejects invalid email', () => {
    expect(() => userProfileSchema.parse({ ...validProfile, email: 'not-an-email' })).toThrow();
  });

  it('rejects invalid locale', () => {
    expect(() => userProfileSchema.parse({ ...validProfile, locale: 'de' })).toThrow();
  });
});
