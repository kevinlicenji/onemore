import { z } from 'zod';

import { difficultyLevelSchema } from '../constants/difficulty-level.js';
import { muscleGroupSchema } from './exercise.js';

export const sessionTypeSchema = z.enum(['programmed', 'free']);

export const workoutSessionStatusSchema = z.enum(['in_progress', 'completed', 'abandoned']);

export const exerciseExecutionStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'skipped',
]);

export const weightPrescriptionModeSchema = z.enum(['absolute', 'percent_of_max']);

export const prescriptionSnapshotSchema = z.object({
  targetSets: z.number().int(),
  targetReps: z.number().int(),
  targetWeightKg: z.number().nullable(),
  restSeconds: z.number().int(),
  coachNote: z.string().nullable(),
  weightPrescriptionMode: weightPrescriptionModeSchema.default('absolute'),
  targetPercentOfMax: z.number().int().min(1).max(100).nullable().optional(),
});

export const startWorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  sessionType: sessionTypeSchema,
  programAssignmentId: z.string().uuid().optional(),
  workoutDayId: z.string().uuid().optional(),
});

export const upsertSetLogSchema = z.object({
  id: z.string().uuid(),
  exerciseExecutionId: z.string().uuid(),
  setNumber: z.number().int().min(1).max(30),
  weightKg: z.number().min(0).max(500).nullable().optional(),
  reps: z.number().int().min(0).max(100).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
  isWarmup: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
  isSkipped: z.boolean().default(false),
  isFailed: z.boolean().default(false),
  clientTimestamp: z.string().datetime(),
});

export const addWorkoutExerciseSchema = z.object({
  exerciseLibraryId: z.string().uuid(),
  targetSets: z.number().int().min(1).max(20).default(3),
  targetReps: z.number().int().min(1).max(100).default(10),
  restSeconds: z.number().int().min(0).max(600).default(90),
});

export const addWorkoutSetSchema = z.object({
  id: z.string().uuid(),
});

export const substituteExerciseSchema = z.object({
  exerciseLibraryId: z.string().uuid(),
});

export const updateWorkoutSessionNotesSchema = z.object({
  privateNotes: z.string().max(2000).nullable(),
});

export const updateWorkoutExerciseNotesSchema = z.object({
  athleteNotes: z.string().max(2000).nullable(),
});

export const setLogSchema = z.object({
  id: z.string().uuid(),
  setNumber: z.number().int(),
  weightKg: z.number().nullable(),
  reps: z.number().int().nullable(),
  rpe: z.number().nullable(),
  rir: z.number().int().nullable(),
  isWarmup: z.boolean(),
  isCompleted: z.boolean(),
  isSkipped: z.boolean(),
  isFailed: z.boolean(),
  clientTimestamp: z.string().datetime(),
});

export const workoutExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseLibraryId: z.string().uuid(),
  substitutedFromExerciseId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int(),
  status: exerciseExecutionStatusSchema,
  athleteNotes: z.string().nullable(),
  prescription: prescriptionSnapshotSchema,
  exercise: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    names: z.object({ en: z.string(), it: z.string().optional() }),
    isBodyweight: z.boolean(),
  }),
  sets: z.array(setLogSchema),
  previousSet: z
    .object({
      weightKg: z.number().nullable(),
      reps: z.number().int().nullable(),
    })
    .nullable(),
  previousExecution: z
    .object({
      setsCount: z.number().int(),
      reps: z.number().int().nullable(),
      weightKg: z.number().nullable(),
      completedAt: z.string().datetime().nullable(),
    })
    .nullable()
    .optional(),
});

export const workoutSessionDetailSchema = z.object({
  id: z.string().uuid(),
  status: workoutSessionStatusSchema,
  sessionType: sessionTypeSchema,
  programAssignmentId: z.string().uuid().nullable(),
  workoutDayId: z.string().uuid().nullable(),
  workoutDayLabel: z.string().nullable(),
  workoutDayDifficultyLevel: difficultyLevelSchema.nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  durationSeconds: z.number().int().nullable(),
  privateNotes: z.string().nullable(),
  exercises: z.array(workoutExerciseSchema),
});

export const nextWorkoutDayExerciseSchema = z.object({
  programExerciseId: z.string().uuid(),
  exerciseLibraryId: z.string().uuid(),
  sortOrder: z.number().int(),
  targetSets: z.number().int(),
  targetReps: z.number().int(),
  targetWeightKg: z.number().nullable(),
  weightPrescriptionMode: weightPrescriptionModeSchema.default('absolute'),
  targetPercentOfMax: z.number().int().min(1).max(100).nullable().optional(),
  restSeconds: z.number().int(),
  coachNote: z.string().nullable(),
  exercise: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    names: z.object({ en: z.string(), it: z.string().optional() }),
    isBodyweight: z.boolean(),
  }),
});

export const workoutDayOptionSchema = z.object({
  workoutDayId: z.string().uuid(),
  label: z.string(),
  difficultyLevel: difficultyLevelSchema,
  exerciseCount: z.number().int(),
  muscleGroups: z.array(muscleGroupSchema),
  exercises: z.array(nextWorkoutDayExerciseSchema),
});

export const nextWorkoutPreviewSchema = z.object({
  hasActiveAssignment: z.boolean(),
  programAssignmentId: z.string().uuid().nullable(),
  workoutDayId: z.string().uuid().nullable(),
  workoutDayLabel: z.string().nullable(),
  exerciseCount: z.number().int(),
  programName: z.string().nullable(),
  exercises: z.array(nextWorkoutDayExerciseSchema),
  days: z.array(workoutDayOptionSchema),
});

export type PrescriptionSnapshot = z.infer<typeof prescriptionSnapshotSchema>;
export type StartWorkoutSessionInput = z.infer<typeof startWorkoutSessionSchema>;
export type UpsertSetLogInput = z.infer<typeof upsertSetLogSchema>;
export type AddWorkoutExerciseInput = z.infer<typeof addWorkoutExerciseSchema>;
export type AddWorkoutSetInput = z.infer<typeof addWorkoutSetSchema>;
export type SubstituteExerciseInput = z.infer<typeof substituteExerciseSchema>;
export type UpdateWorkoutSessionNotesInput = z.infer<typeof updateWorkoutSessionNotesSchema>;
export type UpdateWorkoutExerciseNotesInput = z.infer<typeof updateWorkoutExerciseNotesSchema>;
export type WorkoutSessionDetail = z.infer<typeof workoutSessionDetailSchema>;
export type WorkoutDayOption = z.infer<typeof workoutDayOptionSchema>;
export type NextWorkoutPreview = z.infer<typeof nextWorkoutPreviewSchema>;
