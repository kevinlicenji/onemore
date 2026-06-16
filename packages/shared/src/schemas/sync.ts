import { z } from 'zod';

import { exerciseListItemSchema } from './exercise.js';
import {
  nextWorkoutPreviewSchema,
  prescriptionSnapshotSchema,
  workoutSessionDetailSchema,
} from './workout.js';

export const syncWorkoutSessionPayloadSchema = z.object({
  id: z.string().uuid(),
  programAssignmentId: z.string().uuid().nullable().optional(),
  workoutDayId: z.string().uuid().nullable().optional(),
  status: z.enum(['in_progress', 'completed', 'abandoned']),
  sessionType: z.enum(['programmed', 'free']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable().optional(),
  durationSeconds: z.number().int().nullable().optional(),
  clientUpdatedAt: z.string().datetime(),
});

export const syncExerciseExecutionPayloadSchema = z.object({
  id: z.string().uuid(),
  workoutSessionId: z.string().uuid(),
  exerciseLibraryId: z.string().uuid(),
  programExerciseId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
  prescriptionSnapshot: prescriptionSnapshotSchema,
});

export const syncSetLogPayloadSchema = z.object({
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

export const syncMutationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('workout_session'),
    op: z.literal('upsert'),
    payload: syncWorkoutSessionPayloadSchema,
  }),
  z.object({
    type: z.literal('exercise_execution'),
    op: z.literal('upsert'),
    payload: syncExerciseExecutionPayloadSchema,
  }),
  z.object({
    type: z.literal('set_log'),
    op: z.literal('upsert'),
    payload: syncSetLogPayloadSchema,
  }),
]);

export const syncBatchRequestSchema = z.object({
  clientSyncId: z.string().uuid(),
  mutations: z.array(syncMutationSchema).max(500),
});

export const syncConflictSchema = z.object({
  entityId: z.string().uuid(),
  type: z.string(),
  reason: z.string(),
});

export const syncBatchResponseSchema = z.object({
  serverTime: z.string().datetime(),
  acknowledged: z.array(z.string().uuid()),
  conflicts: z.array(syncConflictSchema),
});

export const syncDeltaQuerySchema = z.object({
  since: z.string().datetime().optional(),
});

export const syncDeltaResponseSchema = z.object({
  serverTime: z.string().datetime(),
  exercises: z.array(exerciseListItemSchema),
  nextWorkout: nextWorkoutPreviewSchema,
  sessions: z.array(workoutSessionDetailSchema),
});

export type SyncMutation = z.infer<typeof syncMutationSchema>;
export type SyncBatchRequest = z.infer<typeof syncBatchRequestSchema>;
export type SyncBatchResponse = z.infer<typeof syncBatchResponseSchema>;
export type SyncDeltaResponse = z.infer<typeof syncDeltaResponseSchema>;
