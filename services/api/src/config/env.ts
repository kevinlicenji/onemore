import { readFileSync } from 'node:fs';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  API_VERSION: z.string().default('0.1.0'),
  WEB_APP_URL: z.string().url().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_PRIVATE_KEY_PATH: z.string().optional(),
  JWT_PUBLIC_KEY_PATH: z.string().optional(),
  REFRESH_COOKIE_NAME: z.string().default('onemore_refresh'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  APPLE_REDIRECT_URI: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EXPORT_STORAGE_PATH: z.string().default('./data/exports'),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  CONSENT_VERSION_TOS: z.string().default('tos-2026-01'),
  CONSENT_VERSION_PRIVACY: z.string().default('privacy-2026-01'),
  CONSENT_VERSION_FITNESS: z.string().default('fitness-2026-01'),
});

export type Env = z.infer<typeof envSchema> & {
  jwtPrivateKeyPem: string;
  jwtPublicKeyPem: string;
};

function readPemFromEnvOrFile(
  envValue: string | undefined,
  path: string | undefined,
): string | undefined {
  if (envValue) {
    return envValue.replace(/\\n/g, '\n');
  }
  if (path) {
    return readFileSync(path, 'utf8');
  }
  return undefined;
}

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

  const jwtPrivateKeyPem = readPemFromEnvOrFile(
    parsed.data.JWT_PRIVATE_KEY,
    parsed.data.JWT_PRIVATE_KEY_PATH,
  );
  const jwtPublicKeyPem = readPemFromEnvOrFile(
    parsed.data.JWT_PUBLIC_KEY,
    parsed.data.JWT_PUBLIC_KEY_PATH,
  );

  if (!jwtPrivateKeyPem || !jwtPublicKeyPem) {
    throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY (or *_PATH) are required for RS256 auth');
  }

  return {
    ...parsed.data,
    jwtPrivateKeyPem,
    jwtPublicKeyPem,
  };
}
