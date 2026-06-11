import { z } from 'zod';

import { trainingEnvironmentSchema, trainingGoalSchema, trainingLevelSchema } from './user.js';

/**
 * Partial onboarding fields saved per step during the wizard.
 */
export const onboardingUpdateSchema = z
  .object({
    trainingGoal: trainingGoalSchema,
    trainingLevel: trainingLevelSchema,
    trainingEnvironment: trainingEnvironmentSchema,
    trainingDaysPerWeek: z.number().int().min(1).max(7),
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
  motivationLevel: z.number().int().min(1).max(3),
});

export type OnboardingUpdate = z.infer<typeof onboardingUpdateSchema>;
export type OnboardingComplete = z.infer<typeof onboardingCompleteSchema>;
