import { z } from 'zod';

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);

/** RFC-style email used for registration and password reset. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .transform((value) => value.toLowerCase());

/**
 * Username: letters, digits, underscore only — never `@` (reserved for email login).
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .superRefine((value, ctx) => {
    if (value.includes('@')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username cannot contain @',
      });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username must contain only letters, numbers, and underscore',
      });
    }
  });

export const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  displayName: z.string().min(1).max(100).optional(),
  locale: z.enum(['it', 'en']).default('it'),
  birthYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() - 16),
  timezone: z.string().min(1).default('Europe/Rome'),
  consents: z.object({
    tos: z.literal(true),
    privacy: z.literal(true),
    fitnessData: z.literal(true),
  }),
});

export const loginBodySchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1),
});

/**
 * Normalize login identifier for lookup (email or username).
 *
 * @param identifier - Raw value from the login form.
 * @returns Lowercased identifier.
 */
export function normalizeLoginIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

/**
 * Whether the login identifier should be resolved as an email address.
 *
 * @param identifier - Normalized login identifier.
 */
export function isEmailLoginIdentifier(identifier: string): boolean {
  return identifier.includes('@');
}

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const authTokensResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    locale: z.enum(['it', 'en']),
  }),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type AuthTokensResponse = z.infer<typeof authTokensResponseSchema>;
