import { z } from 'zod';

import { MUSCLE_GROUPS } from '../constants/muscle-groups.js';

export const muscleGroupSchema = z.enum(MUSCLE_GROUPS);

export const muscleTagsSchema = z.array(muscleGroupSchema).min(1).max(3);

export const exerciseNamesSchema = z.object({
  en: z.string().min(1).max(200),
  it: z.string().min(1).max(200).optional(),
});

export const exerciseListItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  names: exerciseNamesSchema,
  category: z.string(),
  primaryMuscles: muscleTagsSchema,
  secondaryMuscles: z.array(z.string()),
  equipment: z.string(),
  isBodyweight: z.boolean(),
  isCustom: z.boolean(),
});

export const exerciseEquipmentGroupSchema = z.enum([
  'machines',
  'bodyweight',
  'free_weights',
  'cables',
  'cardio',
]);

export const exerciseSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  equipment: z.string().trim().min(1).max(50).optional(),
  isBodyweight: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  equipmentGroup: exerciseEquipmentGroupSchema.optional(),
  muscle: muscleGroupSchema.optional(),
  limit: z.coerce.number().int().min(1).max(250).default(25),
});

export const createCustomExerciseSchema = z.object({
  names: exerciseNamesSchema,
  category: z.string().min(1).max(50),
  primaryMuscles: muscleTagsSchema,
  secondaryMuscles: z.array(z.string().min(1)).max(10).default([]),
  equipment: z.string().min(1).max(50),
  isBodyweight: z.boolean().default(false),
});

export const updateCustomExerciseSchema = z.object({
  isBodyweight: z.boolean(),
});

export type ExerciseListItem = z.infer<typeof exerciseListItemSchema>;
export type ExerciseSearchQuery = z.infer<typeof exerciseSearchQuerySchema>;
export type CreateCustomExercise = z.infer<typeof createCustomExerciseSchema>;
export type UpdateCustomExercise = z.infer<typeof updateCustomExerciseSchema>;
