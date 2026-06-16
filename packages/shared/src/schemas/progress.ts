import { z } from 'zod';

import { pendingMaxProposalSchema } from './max-values.js';
import { workoutSessionDetailSchema } from './workout.js';

export const prTypeSchema = z.enum(['weight_pr', 'volume_pr', 'e1rm_pr']);

export const personalRecordSummarySchema = z.object({
  id: z.string().uuid(),
  exerciseLibraryId: z.string().uuid(),
  exerciseName: z.string(),
  prType: prTypeSchema,
  reps: z.number().int().nullable(),
  value: z.number(),
  achievedAt: z.string().datetime(),
});

export const upsertSetResponseSchema = z.object({
  session: workoutSessionDetailSchema,
  personalRecords: z.array(personalRecordSummarySchema),
  pendingMaxProposal: pendingMaxProposalSchema.nullable().optional(),
});

export type PrType = z.infer<typeof prTypeSchema>;
export type PersonalRecordSummary = z.infer<typeof personalRecordSummarySchema>;
export type UpsertSetResponse = z.infer<typeof upsertSetResponseSchema>;
