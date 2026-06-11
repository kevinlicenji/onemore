import { z } from 'zod';

import { sessionTypeSchema, workoutSessionStatusSchema } from './workout.js';

export const historySessionSummarySchema = z.object({
  id: z.string().uuid(),
  status: workoutSessionStatusSchema,
  sessionType: sessionTypeSchema,
  workoutDayLabel: z.string().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  durationSeconds: z.number().int().nullable(),
  exerciseCount: z.number().int(),
  totalSets: z.number().int(),
  totalVolumeKg: z.number(),
});

export const historyListQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const historyListResponseSchema = z.object({
  items: z.array(historySessionSummarySchema),
  nextCursor: z.string().uuid().nullable(),
});

export type HistorySessionSummary = z.infer<typeof historySessionSummarySchema>;
export type HistoryListQuery = z.infer<typeof historyListQuerySchema>;
export type HistoryListResponse = z.infer<typeof historyListResponseSchema>;
