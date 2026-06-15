import { z } from 'zod';

import { SupplementUnitEnum } from './supplement.js';

export const adminCreateSupplementSchema = z.object({
  nameIt: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  unit: SupplementUnitEnum,
});

export const adminUpdateSupplementSchema = adminCreateSupplementSchema.partial();

export const adminSupplementSchema = z.object({
  id: z.string().uuid(),
  name: z.object({ it: z.string(), en: z.string() }),
  unit: SupplementUnitEnum,
  deletedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AdminCreateSupplement = z.infer<typeof adminCreateSupplementSchema>;
export type AdminUpdateSupplement = z.infer<typeof adminUpdateSupplementSchema>;
export type AdminSupplement = z.infer<typeof adminSupplementSchema>;
