import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z
    .string()
    .min(32)
    .optional()
    .refine(
      (value) => {
        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === 'production') {
          return value !== undefined && value.length >= 32;
        }
        return true;
      },
      { message: 'JWT_SECRET is required in production (min 32 characters)' },
    ),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_VERSION: z.string().default('0.1.0'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate process environment variables at startup.
 *
 * @returns Validated environment configuration.
 * @throws When required variables are missing or invalid.
 */
export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    throw new Error(`Invalid environment configuration: ${message}`);
  }
  return parsed.data;
}
