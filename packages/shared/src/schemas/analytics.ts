import { z } from 'zod';

import { personalRecordSummarySchema } from './progress.js';
import { nextWorkoutPreviewSchema } from './workout.js';

export const analyticsLastWorkoutSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable(),
  completedAt: z.string().datetime(),
  durationSeconds: z.number().int().nullable(),
});

export const analyticsDashboardSchema = z.object({
  streakWeeks: z.number().int(),
  workoutsThisWeek: z.number().int(),
  weeklyVolumeKg: z.number(),
  lastWorkout: analyticsLastWorkoutSchema.nullable(),
  nextWorkout: nextWorkoutPreviewSchema,
  recentPersonalRecords: z.array(personalRecordSummarySchema),
});

export type AnalyticsDashboard = z.infer<typeof analyticsDashboardSchema>;
