import { z } from 'zod';

import { trainingEnvironmentSchema, trainingGoalSchema, trainingLevelSchema } from './user.js';
import { personNameSchema, usernameSchema } from './auth.js';
import { updateUserSettingsSchema } from './settings.js';

export const updateUserProfileSchema = z.object({
  firstName: personNameSchema.optional(),
  lastName: personNameSchema.optional(),
  displayName: z.string().min(1).max(100).optional(),
  username: usernameSchema.optional(),
  locale: z.enum(['it', 'en']).optional(),
  birthYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() - 16)
    .optional(),
  heightCm: z.number().positive().max(300).optional(),
  timezone: z.string().min(1).optional(),
  motivationLevel: z.number().int().min(1).max(3).optional(),
  trainingGoal: trainingGoalSchema.optional(),
  trainingLevel: trainingLevelSchema.optional(),
  trainingEnvironment: trainingEnvironmentSchema.optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  settings: updateUserSettingsSchema.optional(),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
