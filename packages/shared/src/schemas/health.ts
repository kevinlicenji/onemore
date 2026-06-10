import { z } from 'zod';

/**
 * Health check response from the API.
 */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
