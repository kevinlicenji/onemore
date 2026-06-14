import { z } from 'zod';

import { exerciseNamesSchema } from './exercise.js';

export const adminExerciseDescriptionSchema = z.object({
  en: z.string().max(2000).optional(),
  it: z.string().max(2000).optional(),
});

export const adminCreateSystemExerciseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  names: exerciseNamesSchema,
  description: adminExerciseDescriptionSchema.optional(),
  category: z.string().min(1).max(50),
  primaryMuscles: z.array(z.string().min(1)).min(1).max(3),
  secondaryMuscles: z.array(z.string().min(1)).max(10).default([]),
  equipment: z.string().min(1).max(50),
  isBodyweight: z.boolean().default(false),
  wgerId: z.number().int().positive().optional(),
});

export const adminUpdateSystemExerciseSchema = adminCreateSystemExerciseSchema
  .omit({ slug: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const adminSystemExerciseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  names: exerciseNamesSchema,
  description: adminExerciseDescriptionSchema.nullable(),
  category: z.string(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  equipment: z.string(),
  isBodyweight: z.boolean(),
  wgerId: z.number().int().nullable(),
  deletedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const adminSetUserAdminSchema = z.object({
  isAdmin: z.boolean(),
});

export type AdminCreateSystemExercise = z.infer<typeof adminCreateSystemExerciseSchema>;
export type AdminUpdateSystemExercise = z.infer<typeof adminUpdateSystemExerciseSchema>;
export type AdminSystemExercise = z.infer<typeof adminSystemExerciseSchema>;
