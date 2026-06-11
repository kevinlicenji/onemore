import { z } from 'zod';

export const sessionTypeSchema = z.enum(['programmed', 'free']);

export const workoutSessionStatusSchema = z.enum(['in_progress', 'completed', 'abandoned']);

export const exerciseExecutionStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'skipped',
]);

export const prescriptionSnapshotSchema = z.object({
  targetSets: z.number().int(),
  targetReps: z.number().int(),
  targetWeightKg: z.number().nullable(),
  restSeconds: z.number().int(),
  coachNote: z.string().nullable(),
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

export const setLogSchema = z.object({
  id: z.string().uuid(),
  setNumber: z.number().int(),
  weightKg: z.number().nullable(),
  reps: z.number().int().nullable(),
  isWarmup: z.boolean(),
  isCompleted: z.boolean(),
  isSkipped: z.boolean(),
  isFailed: z.boolean(),
  clientTimestamp: z.string().datetime(),
});

export const workoutExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseLibraryId: z.string().uuid(),
  sortOrder: z.number().int(),
  status: exerciseExecutionStatusSchema,
  prescription: prescriptionSnapshotSchema,
  exercise: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    names: z.object({ en: z.string(), it: z.string().optional() }),
  }),
  sets: z.array(setLogSchema),
  previousSet: z
    .object({
      weightKg: z.number().nullable(),
      reps: z.number().int().nullable(),
    })
    .nullable(),
});

export const workoutSessionDetailSchema = z.object({
  id: z.string().uuid(),
  status: workoutSessionStatusSchema,
  sessionType: sessionTypeSchema,
  programAssignmentId: z.string().uuid().nullable(),
  workoutDayId: z.string().uuid().nullable(),
  workoutDayLabel: z.string().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  durationSeconds: z.number().int().nullable(),
  exercises: z.array(workoutExerciseSchema),
});

export const nextWorkoutPreviewSchema = z.object({
  hasActiveAssignment: z.boolean(),
  programAssignmentId: z.string().uuid().nullable(),
  workoutDayId: z.string().uuid().nullable(),
  workoutDayLabel: z.string().nullable(),
  exerciseCount: z.number().int(),
  programName: z.string().nullable(),
});

export type PrescriptionSnapshot = z.infer<typeof prescriptionSnapshotSchema>;
export type StartWorkoutSessionInput = z.infer<typeof startWorkoutSessionSchema>;
export type UpsertSetLogInput = z.infer<typeof upsertSetLogSchema>;
export type AddWorkoutExerciseInput = z.infer<typeof addWorkoutExerciseSchema>;
export type WorkoutSessionDetail = z.infer<typeof workoutSessionDetailSchema>;
export type NextWorkoutPreview = z.infer<typeof nextWorkoutPreviewSchema>;
