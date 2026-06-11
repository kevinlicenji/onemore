import { z } from 'zod';

export const dataExportStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export const dataExportJobSchema = z.object({
  id: z.string().uuid(),
  status: dataExportStatusSchema,
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  downloadReady: z.boolean(),
});

export const requestDataExportResponseSchema = z.object({
  job: dataExportJobSchema,
});

export const accountDeletionResponseSchema = z.object({
  deletedAt: z.string().datetime(),
  scheduledHardDeleteAt: z.string().datetime(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type DataExportJob = z.infer<typeof dataExportJobSchema>;
export type RequestDataExportResponse = z.infer<typeof requestDataExportResponseSchema>;
export type AccountDeletionResponse = z.infer<typeof accountDeletionResponseSchema>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
