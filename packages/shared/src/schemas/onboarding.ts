import { z } from 'zod';

import { muscleGroupSchema } from './exercise.js';
import { trainingEnvironmentSchema, trainingGoalSchema, trainingLevelSchema } from './user.js';

/**
 * Partial onboarding fields saved per step during the wizard.
 */
export const preferredSessionMinutesSchema = z.union([
  z.literal(30),
  z.literal(45),
  z.literal(60),
  z.literal(75),
  z.literal(90),
]);

export const preferredMuscleGroupsSchema = z.array(muscleGroupSchema).min(1).max(8);

export const onboardingUpdateSchema = z
  .object({
    trainingGoal: trainingGoalSchema,
    trainingLevel: trainingLevelSchema,
    trainingEnvironment: trainingEnvironmentSchema,
    trainingDaysPerWeek: z.number().int().min(1).max(7),
    preferredSessionMinutes: preferredSessionMinutesSchema,
    preferredMuscleGroups: preferredMuscleGroupsSchema,
    motivationLevel: z.number().int().min(1).max(3),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one onboarding field is required',
  });

/**
 * All fields required before marking onboarding complete.
 */
export const onboardingCompleteSchema = z.object({
  trainingGoal: trainingGoalSchema,
  trainingLevel: trainingLevelSchema,
  trainingEnvironment: trainingEnvironmentSchema,
  trainingDaysPerWeek: z.number().int().min(1).max(7),
  preferredSessionMinutes: preferredSessionMinutesSchema,
  preferredMuscleGroups: preferredMuscleGroupsSchema,
  motivationLevel: z.number().int().min(1).max(3),
});

export type OnboardingUpdate = z.infer<typeof onboardingUpdateSchema>;
export type OnboardingComplete = z.infer<typeof onboardingCompleteSchema>;
