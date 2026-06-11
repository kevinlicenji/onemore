import { z } from 'zod';

export const notificationPreferencesSchema = z.object({
  workoutReminders: z.boolean().default(true),
  progressUpdates: z.boolean().default(true),
  prCelebrations: z.boolean().default(true),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .default(null),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .default(null),
});

export const userSettingsSchema = z.object({
  units: z.enum(['metric', 'imperial']).default('metric'),
  notifications: notificationPreferencesSchema.default({
    workoutReminders: true,
    progressUpdates: true,
    prCelebrations: true,
    quietHoursStart: null,
    quietHoursEnd: null,
  }),
});

export const updateUserSettingsSchema = z.object({
  units: z.enum(['metric', 'imperial']).optional(),
  notifications: notificationPreferencesSchema.partial().optional(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

export const DEFAULT_USER_SETTINGS: UserSettings = userSettingsSchema.parse({});
