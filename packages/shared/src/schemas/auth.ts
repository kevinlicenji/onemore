import { z } from 'zod';

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const usernameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Username must be 3–30 alphanumeric or underscore');

export const registerBodySchema = z.object({
  email: z.string().email().toLowerCase(),
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
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email().toLowerCase(),
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
