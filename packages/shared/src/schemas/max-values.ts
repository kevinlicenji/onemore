import { z } from 'zod';

export const maxSourceSchema = z.enum(['MANUAL', 'AUTOMATIC_APPROVED']);

export const logStatusSchema = z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'MANUAL_ENTRY']);

export const userExerciseMaxSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  weight: z.number(),
  source: maxSourceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const maxHistoryLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  weight: z.number(),
  reps: z.number().int(),
  calculated1RM: z.number(),
  status: logStatusSchema,
  date: z.string().datetime(),
});

export const userExerciseMaxWithExerciseSchema = userExerciseMaxSchema.extend({
  exercise: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    names: z.object({ en: z.string(), it: z.string().optional() }),
  }),
});

export const maxHistoryLogWithExerciseSchema = maxHistoryLogSchema.extend({
  exercise: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    names: z.object({ en: z.string(), it: z.string().optional() }),
  }),
});

export const insertManualMaxSchema = z.object({
  exerciseId: z.string().uuid(),
  weight: z.number().min(0.5).max(9999),
});

export const resolvePendingMaxSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});

export const pendingMaxProposalSchema = z.object({
  logId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  exerciseName: z.string(),
  weight: z.number(),
  reps: z.number().int(),
  calculated1RM: z.number(),
});

export type MaxSource = z.infer<typeof maxSourceSchema>;
export type LogStatus = z.infer<typeof logStatusSchema>;
export type UserExerciseMax = z.infer<typeof userExerciseMaxSchema>;
export type MaxHistoryLog = z.infer<typeof maxHistoryLogSchema>;
export type UserExerciseMaxWithExercise = z.infer<typeof userExerciseMaxWithExerciseSchema>;
export type MaxHistoryLogWithExercise = z.infer<typeof maxHistoryLogWithExerciseSchema>;
export type InsertManualMaxInput = z.infer<typeof insertManualMaxSchema>;
export type ResolvePendingMaxInput = z.infer<typeof resolvePendingMaxSchema>;
export type PendingMaxProposal = z.infer<typeof pendingMaxProposalSchema>;
