import { z } from 'zod';

import { personalRecordSummarySchema } from './progress.js';
import { nextWorkoutPreviewSchema } from './workout.js';

export const weekDayStatusSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  label: z.string(),
  completed: z.boolean(),
  isToday: z.boolean(),
});

export const weeklyTargetSourceSchema = z.enum(['program', 'onboarding', 'default']);

export const analyticsLastWorkoutSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable(),
  completedAt: z.string().datetime(),
  durationSeconds: z.number().int().nullable(),
});

export const analyticsDashboardSchema = z.object({
  streakWeeks: z.number().int(),
  generatedAt: z.string().datetime(),
  weeklyConsistency: z.object({
    weekDays: z.array(weekDayStatusSchema),
    workoutsCompleted: z.number().int(),
    weeklyTarget: z.number().int(),
    targetSource: weeklyTargetSourceSchema,
  }),
  volumeComparison: z.object({
    lastWeekKg: z.number(),
    thisWeekKg: z.number(),
    progressToMatchLastWeek: z.number().int().min(0).max(100),
  }),
  programNavigation: z.object({
    lastCompletedDayLabel: z.string().nullable(),
    nextDayLabel: z.string().nullable(),
    nextWorkoutDayId: z.string().uuid().nullable(),
    programName: z.string().nullable(),
    hasActiveProgram: z.boolean(),
  }),
  monthlyStats: z.object({
    personalRecordsCount: z.number().int(),
    completedSetsCount: z.number().int(),
  }),
  workoutsThisWeek: z.number().int(),
  weeklySetsCompleted: z.number().int(),
  weeklyVolumeKg: z.number(),
  lastWorkout: analyticsLastWorkoutSchema.nullable(),
  nextWorkout: nextWorkoutPreviewSchema,
  recentPersonalRecords: z.array(personalRecordSummarySchema),
});

export type WeekDayStatus = z.infer<typeof weekDayStatusSchema>;
export type WeeklyTargetSource = z.infer<typeof weeklyTargetSourceSchema>;
export type AnalyticsDashboard = z.infer<typeof analyticsDashboardSchema>;
