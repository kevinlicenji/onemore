import { describe, expect, it } from 'vitest';
import {
  SupplementUnitEnum,
  SupplementNameSchema,
  SupplementBaseSchema,
  CreateSupplementInputSchema,
  UpdateSupplementInputSchema,
  SupplementLogBaseSchema,
  CreateSupplementLogInputSchema,
  UpdateSupplementLogInputSchema,
  SupplementLogQuerySchema,
  RepeatYesterdayInputSchema,
} from './supplement.js';

describe('Supplement schemas', () => {
  describe('SupplementUnitEnum', () => {
    it('accepts valid units', () => {
      expect(SupplementUnitEnum.safeParse('g').success).toBe(true);
      expect(SupplementUnitEnum.safeParse('mg').success).toBe(true);
      expect(SupplementUnitEnum.safeParse('capsule').success).toBe(true);
      expect(SupplementUnitEnum.safeParse('scoop').success).toBe(true);
      expect(SupplementUnitEnum.safeParse('drops').success).toBe(true);
    });

    it('rejects invalid units', () => {
      expect(SupplementUnitEnum.safeParse('ml').success).toBe(false);
      expect(SupplementUnitEnum.safeParse('tablets').success).toBe(false);
    });
  });

  describe('SupplementNameSchema', () => {
    it('accepts valid bilingual names', () => {
      const result = SupplementNameSchema.safeParse({ it: 'Creatina', en: 'Creatine' });
      expect(result.success).toBe(true);
    });

    it('rejects missing locale', () => {
      const result = SupplementNameSchema.safeParse({ it: 'Creatina' });
      expect(result.success).toBe(false);
    });

    it('rejects empty strings', () => {
      const result = SupplementNameSchema.safeParse({ it: '', en: 'Creatine' });
      expect(result.success).toBe(false);
    });
  });

  describe('SupplementBaseSchema', () => {
    it('accepts valid supplement data', () => {
      const data = {
        name: { it: 'Creatina', en: 'Creatine' },
        brand: 'Optimum Nutrition',
        unit: 'g' as const,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
      const result = SupplementBaseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects negative macros', () => {
      const data = {
        name: { it: 'Creatina', en: 'Creatine' },
        unit: 'g' as const,
        calories: -10,
      };
      const result = SupplementBaseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateSupplementInputSchema', () => {
    it('accepts minimal valid input', () => {
      const data = { name: { it: 'Creatina', en: 'Creatine' }, unit: 'g' as const };
      const result = CreateSupplementInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateSupplementInputSchema', () => {
    it('accepts partial updates', () => {
      const data = { brand: 'New Brand' };
      const result = UpdateSupplementInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('SupplementLogBaseSchema', () => {
    it('accepts valid log data', () => {
      const data = {
        supplementId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 5,
        notes: 'Pre-workout',
        date: '2026-06-15T00:00:00.000Z',
      };
      const result = SupplementLogBaseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects zero or negative amount', () => {
      const data = {
        supplementId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 0,
        date: '2026-06-15T00:00:00.000Z',
      };
      const result = SupplementLogBaseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const data = {
        supplementId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 5,
        date: '2026-06-15',
      };
      const result = SupplementLogBaseSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateSupplementLogInputSchema', () => {
    it('accepts valid log input', () => {
      const data = {
        supplementId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 5,
        date: '2026-06-15T00:00:00.000Z',
      };
      const result = CreateSupplementLogInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateSupplementLogInputSchema', () => {
    it('requires id field', () => {
      const data = { amount: 10 };
      const result = UpdateSupplementLogInputSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('accepts valid update', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        amount: 10,
      };
      const result = UpdateSupplementLogInputSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('SupplementLogQuerySchema', () => {
    it('provides defaults', () => {
      const result = SupplementLogQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(50);
    });

    it('accepts from/to dates', () => {
      const result = SupplementLogQuerySchema.safeParse({
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-30T23:59:59.999Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('RepeatYesterdayInputSchema', () => {
    it('accepts valid date', () => {
      const result = RepeatYesterdayInputSchema.safeParse({
        date: '2026-06-15T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });
});
