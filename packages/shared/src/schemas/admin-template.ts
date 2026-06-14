import { z } from 'zod';

import { templateMetaSchema } from '../constants/template-meta.js';
import { trainingGoalSchema } from './user.js';
import { programDetailSchema, workoutDayInputSchema } from './program.js';

export const adminTemplateSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case');

export const adminCreateTemplateSchema = z.object({
  slug: adminTemplateSlugSchema,
  meta: templateMetaSchema,
  objective: trainingGoalSchema,
  days: z.array(workoutDayInputSchema).min(1).max(7),
});

export const adminUpdateTemplateSchema = z.object({
  meta: templateMetaSchema.optional(),
  objective: trainingGoalSchema.optional(),
  days: z.array(workoutDayInputSchema).min(1).max(7).optional(),
});

export const adminDuplicateTemplateSchema = z.object({
  slug: adminTemplateSlugSchema,
});

export const adminTemplateListItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  displayName: z.string(),
  objective: trainingGoalSchema.nullable(),
  daysCount: z.number().int(),
  latestVersionStatus: z.enum(['draft', 'published', 'archived']).nullable(),
  latestVersionNumber: z.number().int().nullable(),
  hasPublishedVersion: z.boolean(),
  deletedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});

export const adminTemplateDetailSchema = programDetailSchema.extend({
  slug: z.string(),
  meta: templateMetaSchema,
});

export type AdminCreateTemplate = z.infer<typeof adminCreateTemplateSchema>;
export type AdminUpdateTemplate = z.infer<typeof adminUpdateTemplateSchema>;
export type AdminDuplicateTemplate = z.infer<typeof adminDuplicateTemplateSchema>;
export type AdminTemplateListItem = z.infer<typeof adminTemplateListItemSchema>;
export type AdminTemplateDetail = z.infer<typeof adminTemplateDetailSchema>;
