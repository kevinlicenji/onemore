import { describe, expect, it } from 'vitest';

import {
  insertManualMaxSchema,
  resolvePendingMaxSchema,
  userExerciseMaxSchema,
  maxHistoryLogSchema,
  userExerciseMaxWithExerciseSchema,
  maxHistoryLogWithExerciseSchema,
  maxSourceSchema,
  logStatusSchema,
} from './max-values.js';

describe('max-values schemas', () => {
  describe('maxSourceSchema', () => {
    it('accepts MANUAL and AUTOMATIC_APPROVED', () => {
      expect(maxSourceSchema.safeParse('MANUAL').success).toBe(true);
      expect(maxSourceSchema.safeParse('AUTOMATIC_APPROVED').success).toBe(true);
    });

    it('rejects invalid values', () => {
      expect(maxSourceSchema.safeParse('INVALID').success).toBe(false);
      expect(maxSourceSchema.safeParse('').success).toBe(false);
    });
  });

  describe('logStatusSchema', () => {
    it('accepts all log status values', () => {
      expect(logStatusSchema.safeParse('PENDING_APPROVAL').success).toBe(true);
      expect(logStatusSchema.safeParse('APPROVED').success).toBe(true);
      expect(logStatusSchema.safeParse('REJECTED').success).toBe(true);
      expect(logStatusSchema.safeParse('MANUAL_ENTRY').success).toBe(true);
    });

    it('rejects invalid status', () => {
      expect(logStatusSchema.safeParse('PENDING').success).toBe(false);
    });
  });

  describe('insertManualMaxSchema', () => {
    it('accepts valid manual max input', () => {
      const result = insertManualMaxSchema.safeParse({
        exerciseId: '550e8400-e29b-41d4-a716-446655440000',
        weight: 120,
      });
      expect(result.success).toBe(true);
    });

    it('rejects weight below minimum', () => {
      const result = insertManualMaxSchema.safeParse({
        exerciseId: '550e8400-e29b-41d4-a716-446655440000',
        weight: 0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid exerciseId', () => {
      const result = insertManualMaxSchema.safeParse({
        exerciseId: 'not-a-uuid',
        weight: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resolvePendingMaxSchema', () => {
    it('accepts APPROVE and REJECT actions', () => {
      expect(resolvePendingMaxSchema.safeParse({ action: 'APPROVE' }).success).toBe(true);
      expect(resolvePendingMaxSchema.safeParse({ action: 'REJECT' }).success).toBe(true);
    });

    it('rejects invalid action', () => {
      expect(resolvePendingMaxSchema.safeParse({ action: 'INVALID' }).success).toBe(false);
    });
  });

  describe('userExerciseMaxSchema', () => {
    it('accepts valid user exercise max', () => {
      const result = userExerciseMaxSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        exerciseId: '550e8400-e29b-41d4-a716-446655440002',
        weight: 120,
        source: 'MANUAL',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const result = userExerciseMaxSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('maxHistoryLogSchema', () => {
    it('accepts valid history log', () => {
      const result = maxHistoryLogSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        exerciseId: '550e8400-e29b-41d4-a716-446655440002',
        weight: 100,
        reps: 5,
        calculated1RM: 116.67,
        status: 'PENDING_APPROVAL',
        date: '2026-06-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-integer reps', () => {
      const result = maxHistoryLogSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        exerciseId: '550e8400-e29b-41d4-a716-446655440002',
        weight: 100,
        reps: 5.5,
        calculated1RM: 116.67,
        status: 'PENDING_APPROVAL',
        date: '2026-06-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('userExerciseMaxWithExerciseSchema', () => {
    it('accepts valid max with exercise', () => {
      const result = userExerciseMaxWithExerciseSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        exerciseId: '550e8400-e29b-41d4-a716-446655440002',
        weight: 120,
        source: 'MANUAL',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
        exercise: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          slug: 'bench-press',
          names: { en: 'Bench Press', it: 'Panca Piana' },
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('maxHistoryLogWithExerciseSchema', () => {
    it('accepts valid history log with exercise', () => {
      const result = maxHistoryLogWithExerciseSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        exerciseId: '550e8400-e29b-41d4-a716-446655440002',
        weight: 100,
        reps: 5,
        calculated1RM: 116.67,
        status: 'APPROVED',
        date: '2026-06-01T00:00:00.000Z',
        exercise: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          slug: 'bench-press',
          names: { en: 'Bench Press' },
        },
      });
      expect(result.success).toBe(true);
    });
  });
});
