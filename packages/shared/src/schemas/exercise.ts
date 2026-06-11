import { z } from 'zod';

export const exerciseNamesSchema = z.object({
  en: z.string().min(1).max(200),
  it: z.string().min(1).max(200).optional(),
});

export const exerciseListItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  names: exerciseNamesSchema,
  category: z.string(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  equipment: z.string(),
  isBodyweight: z.boolean(),
  isCustom: z.boolean(),
});

export const exerciseSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const createCustomExerciseSchema = z.object({
  names: exerciseNamesSchema,
  category: z.string().min(1).max(50),
  primaryMuscles: z.array(z.string().min(1)).min(1).max(10),
  secondaryMuscles: z.array(z.string().min(1)).max(10).default([]),
  equipment: z.string().min(1).max(50),
  isBodyweight: z.boolean().default(false),
});

export type ExerciseListItem = z.infer<typeof exerciseListItemSchema>;
export type ExerciseSearchQuery = z.infer<typeof exerciseSearchQuerySchema>;
export type CreateCustomExercise = z.infer<typeof createCustomExerciseSchema>;
