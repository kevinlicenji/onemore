import { z } from 'zod';

import { muscleGroupSchema } from './exercise.js';
import { userSettingsSchema } from './settings.js';

export const trainingGoalSchema = z.enum(['mass', 'strength', 'fat_loss', 'recomp', 'fitness']);

export const trainingLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const trainingEnvironmentSchema = z.enum(['gym', 'home']);

export type TrainingGoal = z.infer<typeof trainingGoalSchema>;
export type TrainingLevel = z.infer<typeof trainingLevelSchema>;
export type TrainingEnvironment = z.infer<typeof trainingEnvironmentSchema>;

/**
 * Public user profile fields returned by GET /users/me.
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerifiedAt: z.string().datetime().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  username: z.string().nullable(),
  locale: z.enum(['it', 'en']),
  birthYear: z.number().int().nullable(),
  heightCm: z.number().nullable(),
  weightKg: z.number().nullable(),
  timezone: z.string(),
  motivationLevel: z.number().int().min(1).max(3).nullable(),
  onboardingCompletedAt: z.string().datetime().nullable(),
  trainingGoal: trainingGoalSchema.nullable(),
  trainingLevel: trainingLevelSchema.nullable(),
  trainingEnvironment: trainingEnvironmentSchema.nullable(),
  trainingDaysPerWeek: z.number().int().nullable(),
  preferredSessionMinutes: z.number().int().nullable(),
  preferredMuscleGroups: z.array(muscleGroupSchema),
  isCoach: z.boolean(),
  isAdmin: z.boolean(),
  mfaEnabled: z.boolean(),
  settings: userSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
