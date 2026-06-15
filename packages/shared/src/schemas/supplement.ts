import { z } from 'zod';

export const SupplementUnitEnum = z.enum(['g', 'mg', 'capsule', 'scoop', 'drops']);
export type SupplementUnit = z.infer<typeof SupplementUnitEnum>;

export const SupplementNameSchema = z.object({
  it: z.string().min(1),
  en: z.string().min(1),
});
export type SupplementName = z.infer<typeof SupplementNameSchema>;

export const SupplementBaseSchema = z.object({
  name: SupplementNameSchema,
  brand: z.string().max(100).optional().nullable(),
  unit: SupplementUnitEnum,
  calories: z.number().min(0).default(0),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
});

export const CreateSupplementInputSchema = SupplementBaseSchema;
export type CreateSupplementInput = z.infer<typeof CreateSupplementInputSchema>;

export const UpdateSupplementInputSchema = SupplementBaseSchema.partial();
export type UpdateSupplementInput = z.infer<typeof UpdateSupplementInputSchema>;

export const SupplementLogBaseSchema = z.object({
  supplementId: z.string().uuid(),
  amount: z.number().positive(),
  notes: z.string().max(500).optional().nullable(),
  date: z.string().datetime({ offset: true }),
});

export const CreateSupplementLogInputSchema = SupplementLogBaseSchema;
export type CreateSupplementLogInput = z.infer<typeof CreateSupplementLogInputSchema>;

export const UpdateSupplementLogInputSchema = SupplementLogBaseSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateSupplementLogInput = z.infer<typeof UpdateSupplementLogInputSchema>;

export const SupplementLogQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  supplementId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  cursor: z.string().optional(),
});
export type SupplementLogQuery = z.infer<typeof SupplementLogQuerySchema>;

export const RepeatYesterdayInputSchema = z.object({
  date: z.string().datetime({ offset: true }),
});
export type RepeatYesterdayInput = z.infer<typeof RepeatYesterdayInputSchema>;

export const SupplementListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  brand: z.string().nullable().optional(),
  unit: SupplementUnitEnum,
  isGlobal: z.boolean(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  recentLogCount: z.number().int().nonnegative().optional(),
});
export type SupplementListItem = z.infer<typeof SupplementListItemSchema>;

export const SupplementDetailSchema = SupplementListItemSchema.extend({
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type SupplementDetail = z.infer<typeof SupplementDetailSchema>;

export const SupplementLogItemSchema = z.object({
  id: z.string().uuid(),
  supplementId: z.string().uuid(),
  supplementName: z.string(),
  supplementUnit: SupplementUnitEnum,
  amount: z.number(),
  notes: z.string().nullable().optional(),
  date: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
});
export type SupplementLogItem = z.infer<typeof SupplementLogItemSchema>;

export const SupplementLogListResponseSchema = z.object({
  logs: z.array(SupplementLogItemSchema),
  nextCursor: z.string().nullable().optional(),
});
export type SupplementLogListResponse = z.infer<typeof SupplementLogListResponseSchema>;

export const SupplementTrendItemSchema = z.object({
  date: z.string().date(),
  hasLogged: z.boolean(),
  totalItems: z.number().int().nonnegative(),
  items: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: SupplementUnitEnum,
  })),
});
export type SupplementTrendItem = z.infer<typeof SupplementTrendItemSchema>;

export const SupplementTrendResponseSchema = z.array(SupplementTrendItemSchema);
export type SupplementTrendResponse = z.infer<typeof SupplementTrendResponseSchema>;

export const TodaySupplementsResponseSchema = z.object({
  date: z.string().date(),
  logs: z.array(SupplementLogItemSchema),
  totalCount: z.number().int().nonnegative(),
});
export type TodaySupplementsResponse = z.infer<typeof TodaySupplementsResponseSchema>;