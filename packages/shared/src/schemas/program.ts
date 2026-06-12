import { z } from 'zod';

import { muscleGroupSchema } from './exercise.js';
import { localizedTextSchema } from '../constants/template-meta.js';
import { trainingGoalSchema } from './user.js';

export const programExerciseInputSchema = z.object({
  exerciseLibraryId: z.string().uuid(),
  targetSets: z.number().int().min(1).max(20),
  targetReps: z.number().int().min(1).max(100),
  restSeconds: z.number().int().min(0).max(600),
  targetWeightKg: z.number().positive().max(500).optional(),
  coachNote: z.string().max(500).optional(),
});

export const workoutDayInputSchema = z.object({
  label: z.string().min(1).max(100),
  exercises: z.array(programExerciseInputSchema).min(1).max(30),
});

export const createProgramSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  objective: trainingGoalSchema.optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
  days: z.array(workoutDayInputSchema).min(1).max(7),
});

export const programSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  objective: trainingGoalSchema.nullable(),
  isTemplate: z.boolean(),
  authorType: z.enum(['self', 'coach', 'template']),
  latestVersionStatus: z.enum(['draft', 'published', 'archived']).nullable(),
  latestVersionNumber: z.number().int().nullable(),
  daysCount: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const programExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseLibraryId: z.string().uuid(),
  sortOrder: z.number().int(),
  targetSets: z.number().int(),
  targetReps: z.number().int(),
  restSeconds: z.number().int(),
  targetWeightKg: z.number().nullable(),
  coachNote: z.string().nullable(),
  exercise: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    names: z.object({ en: z.string(), it: z.string().optional() }),
    primaryMuscles: z.array(muscleGroupSchema),
  }),
});

export const workoutDaySchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  sortOrder: z.number().int(),
  muscleGroups: z.array(muscleGroupSchema),
  exercises: z.array(programExerciseSchema),
});

export const programDetailSchema = programSummarySchema.omit({ isActive: true }).extend({
  isActive: z.boolean(),
  versionId: z.string().uuid().nullable(),
  versionNumber: z.number().int().nullable(),
  versionStatus: z.enum(['draft', 'published', 'archived']).nullable(),
  publishedAt: z.string().datetime().nullable(),
  guide: localizedTextSchema.nullable().optional(),
  days: z.array(workoutDaySchema),
});

export const templateSummarySchema = z.object({
  slug: z.string(),
  name: z.string(),
  /** Localized display name (legacy alias kept for compatibility). */
  description: z.string().nullable(),
  /** Why the template is built this way — training intent and target. */
  guide: localizedTextSchema.nullable(),
  objective: trainingGoalSchema.nullable(),
  daysPerWeek: z.number().int(),
  audience: z.string(),
  equipmentProfile: z
    .enum(['mixed', 'machines', 'free_weights', 'bodyweight', 'dumbbells', 'bands'])
    .nullable(),
  split: z
    .enum(['full_body', 'upper_lower', 'push_pull_legs', 'bro_split', 'conditioning'])
    .nullable(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type ProgramSummary = z.infer<typeof programSummarySchema>;
export type ProgramDetail = z.infer<typeof programDetailSchema>;
export type TemplateSummary = z.infer<typeof templateSummarySchema>;
