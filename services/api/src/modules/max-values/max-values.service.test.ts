import { describe, expect, it, vi } from 'vitest';

import { MaxValuesService } from './max-values.service.js';

function createMockTx() {
  return {
    userExerciseMax: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    maxHistoryLog: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

function createMockPrisma() {
  const tx = createMockTx();
  return {
    userExerciseMax: {
      findMany: vi.fn(),
    },
    maxHistoryLog: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    exerciseLibrary: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
      return callback(tx);
    }),
  };
}

describe('MaxValuesService', () => {
  describe('evaluateSet', () => {
    it('skips warmup sets', async () => {
      const tx = createMockTx();
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rpe: 8,
        isWarmup: true,
        achievedAt: new Date(),
      });

      expect(result).toBeNull();
    });

    it('skips invalid weight or reps', async () => {
      const tx = createMockTx();
      const service = new MaxValuesService({} as never);

      const result1 = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 0,
        reps: 5,
        rpe: 8,
        isWarmup: false,
        achievedAt: new Date(),
      });
      const result2 = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 0,
        rpe: 8,
        isWarmup: false,
        achievedAt: new Date(),
      });

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('skips sets with reps > 10', async () => {
      const tx = createMockTx();
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 80,
        reps: 12,
        rpe: 8,
        isWarmup: false,
        achievedAt: new Date(),
      });

      expect(result).toBeNull();
    });

    it('skips sets without valid RPE (>= 8) or RIR (<= 2)', async () => {
      const tx = createMockTx();
      const service = new MaxValuesService({} as never);

      const result1 = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rpe: 6,
        isWarmup: false,
        achievedAt: new Date(),
      });
      const result2 = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rir: 3,
        isWarmup: false,
        achievedAt: new Date(),
      });
      const result3 = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        isWarmup: false,
        achievedAt: new Date(),
      });

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    it('accepts set with RPE = 8', async () => {
      const tx = createMockTx();
      tx.userExerciseMax.findUnique.mockResolvedValue(null);
      tx.maxHistoryLog.findFirst.mockResolvedValue(null);
      tx.maxHistoryLog.create.mockResolvedValue({
        id: 'log-1',
      });
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rpe: 8,
        isWarmup: false,
        achievedAt: new Date('2026-06-01'),
      });

      expect(result).not.toBeNull();
      expect(result?.calculated1RM).toBeCloseTo(116.67, 2);
      expect(result?.weight).toBe(100);
      expect(result?.reps).toBe(5);
    });

    it('accepts set with RIR = 0', async () => {
      const tx = createMockTx();
      tx.userExerciseMax.findUnique.mockResolvedValue(null);
      tx.maxHistoryLog.findFirst.mockResolvedValue(null);
      tx.maxHistoryLog.create.mockResolvedValue({ id: 'log-1' });
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rir: 0,
        isWarmup: false,
        achievedAt: new Date(),
      });

      expect(result).not.toBeNull();
    });

    it('returns null when existing max is higher than calculated 1RM', async () => {
      const tx = createMockTx();
      tx.userExerciseMax.findUnique.mockResolvedValue({
        weight: 120,
      });
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rpe: 8,
        isWarmup: false,
        achievedAt: new Date(),
      });

      expect(result).toBeNull();
    });

    it('creates pending log when no existing max', async () => {
      const tx = createMockTx();
      tx.userExerciseMax.findUnique.mockResolvedValue(null);
      tx.maxHistoryLog.findFirst.mockResolvedValue(null);
      tx.maxHistoryLog.create.mockResolvedValue({ id: 'log-1' });
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rpe: 8,
        isWarmup: false,
        achievedAt: new Date('2026-06-01'),
      });

      expect(result).not.toBeNull();
      expect(tx.maxHistoryLog.create).toHaveBeenCalled();
    });

    it('deduplicates existing pending logs with same 1RM value', async () => {
      const tx = createMockTx();
      tx.userExerciseMax.findUnique.mockResolvedValue(null);
      tx.maxHistoryLog.findFirst.mockResolvedValue({ id: 'existing-pending' });
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 100,
        reps: 5,
        rpe: 8,
        isWarmup: false,
        achievedAt: new Date(),
      });

      expect(result).toBeNull();
      expect(tx.maxHistoryLog.create).not.toHaveBeenCalled();
    });

    it('creates pending log when calculated 1RM > existing max', async () => {
      const tx = createMockTx();
      tx.userExerciseMax.findUnique.mockResolvedValue({ weight: 100 });
      tx.maxHistoryLog.findFirst.mockResolvedValue(null);
      tx.maxHistoryLog.create.mockResolvedValue({ id: 'log-2' });
      const service = new MaxValuesService({} as never);

      const result = await service.evaluateSet(tx as never, {
        userId: 'user-1',
        exerciseLibraryId: 'ex-1',
        weightKg: 120,
        reps: 3,
        rpe: 9,
        isWarmup: false,
        achievedAt: new Date('2026-06-01'),
      });

      expect(result).not.toBeNull();
      expect(result?.calculated1RM).toBeCloseTo(132, 1);
    });
  });

  describe('listActive', () => {
    it('returns active max values ordered by exercise slug', async () => {
      const prisma = createMockPrisma();
      prisma.userExerciseMax.findMany.mockResolvedValue([
        {
          id: 'max-1',
          userId: 'user-1',
          exerciseId: 'ex-1',
          weight: 120,
          source: 'MANUAL',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-06-01'),
          exercise: {
            id: 'ex-1',
            slug: 'bench-press',
            names: { en: 'Bench Press', it: 'Panca Piana' },
          },
        },
      ]);
      const service = new MaxValuesService(prisma as never);

      const result = await service.listActive('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.weight).toBe(120);
      expect(result[0]?.exercise.slug).toBe('bench-press');
    });
  });

  describe('insertManual', () => {
    it('creates max and history log via transaction', async () => {
      const tx = createMockTx();
      tx.userExerciseMax.upsert.mockResolvedValue({
        id: 'max-1',
        userId: 'user-1',
        exerciseId: 'ex-1',
        weight: 150,
        source: 'MANUAL',
        createdAt: new Date('2026-06-01'),
        updatedAt: new Date('2026-06-01'),
        exercise: { id: 'ex-1', slug: 'squat', names: { en: 'Squat' } },
      });
      const prisma = {
        userExerciseMax: { findMany: vi.fn() },
        maxHistoryLog: { findMany: vi.fn(), findUnique: vi.fn() },
        exerciseLibrary: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'ex-1',
            slug: 'squat',
            names: { en: 'Squat' },
          }),
        },
        $transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback(tx)),
      };
      const service = new MaxValuesService(prisma as never);

      const result = await service.insertManual('user-1', {
        exerciseId: 'ex-1',
        weight: 150,
      });

      expect(result.weight).toBe(150);
      expect(result.source).toBe('MANUAL');
    });

    it('throws 404 when exercise not found', async () => {
      const prisma = createMockPrisma();
      prisma.exerciseLibrary.findUnique.mockResolvedValue(null);
      const service = new MaxValuesService(prisma as never);

      await expect(
        service.insertManual('user-1', { exerciseId: 'ex-999', weight: 100 }),
      ).rejects.toThrow('Exercise not found');
    });
  });

  describe('listPending', () => {
    it('returns pending approval records', async () => {
      const prisma = createMockPrisma();
      prisma.maxHistoryLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          userId: 'user-1',
          exerciseId: 'ex-1',
          weight: 100,
          reps: 5,
          calculated1RM: 116.67,
          status: 'PENDING_APPROVAL',
          date: new Date('2026-06-01'),
          exercise: { id: 'ex-1', slug: 'bench-press', names: { en: 'Bench Press' } },
        },
      ]);
      const service = new MaxValuesService(prisma as never);

      const result = await service.listPending('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe('PENDING_APPROVAL');
      expect(result[0]?.calculated1RM).toBeCloseTo(116.67, 1);
    });
  });

  describe('resolvePending', () => {
    it('approves and upserts max value', async () => {
      const prisma = createMockPrisma();
      prisma.maxHistoryLog.findUnique.mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        exerciseId: 'ex-1',
        weight: 100,
        reps: 5,
        calculated1RM: 116.67,
        status: 'PENDING_APPROVAL',
        date: new Date(),
      });

      const tx = createMockTx();
      prisma.$transaction = vi.fn(async (callback: (tx: unknown) => Promise<void>) => {
        return callback(tx);
      });
      const service = new MaxValuesService(prisma as never);

      await service.resolvePending('user-1', 'log-1', 'APPROVE');

      expect(tx.maxHistoryLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: { status: 'APPROVED' },
      });
      expect(tx.userExerciseMax.upsert).toHaveBeenCalledWith({
        where: { userId_exerciseId: { userId: 'user-1', exerciseId: 'ex-1' } },
        create: {
          userId: 'user-1',
          exerciseId: 'ex-1',
          weight: 116.67,
          source: 'AUTOMATIC_APPROVED',
        },
        update: {
          weight: 116.67,
          source: 'AUTOMATIC_APPROVED',
        },
      });
    });

    it('rejects and only updates log status', async () => {
      const prisma = {
        userExerciseMax: { findMany: vi.fn() },
        maxHistoryLog: {
          findMany: vi.fn(),
          findUnique: vi.fn().mockResolvedValue({
            id: 'log-1',
            userId: 'user-1',
            exerciseId: 'ex-1',
            weight: 100,
            reps: 5,
            calculated1RM: 116.67,
            status: 'PENDING_APPROVAL',
            date: new Date(),
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        exerciseLibrary: { findUnique: vi.fn() },
        $transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback({})),
      };
      const service = new MaxValuesService(prisma as never);

      await service.resolvePending('user-1', 'log-1', 'REJECT');

      expect(prisma.maxHistoryLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: { status: 'REJECTED' },
      });
    });

    it('throws 404 when log not found', async () => {
      const prisma = createMockPrisma();
      prisma.maxHistoryLog.findUnique.mockResolvedValue(null);
      const service = new MaxValuesService(prisma as never);

      await expect(service.resolvePending('user-1', 'log-999', 'APPROVE')).rejects.toThrow(
        'Pending log not found',
      );
    });

    it('throws 404 when log belongs to another user', async () => {
      const prisma = createMockPrisma();
      prisma.maxHistoryLog.findUnique.mockResolvedValue({
        id: 'log-1',
        userId: 'other-user',
        status: 'PENDING_APPROVAL',
      });
      const service = new MaxValuesService(prisma as never);

      await expect(service.resolvePending('user-1', 'log-1', 'APPROVE')).rejects.toThrow(
        'Pending log not found',
      );
    });

    it('throws 409 when log is not pending', async () => {
      const prisma = createMockPrisma();
      prisma.maxHistoryLog.findUnique.mockResolvedValue({
        id: 'log-1',
        userId: 'user-1',
        status: 'APPROVED',
      });
      const service = new MaxValuesService(prisma as never);

      await expect(service.resolvePending('user-1', 'log-1', 'APPROVE')).rejects.toThrow(
        'Log is not pending approval',
      );
    });
  });

  describe('getHistory', () => {
    it('returns approved and manual entry logs ordered by date asc', async () => {
      const prisma = createMockPrisma();
      prisma.maxHistoryLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          userId: 'user-1',
          exerciseId: 'ex-1',
          weight: 100,
          reps: 5,
          calculated1RM: 116.67,
          status: 'APPROVED',
          date: new Date('2026-01-01'),
          exercise: { id: 'ex-1', slug: 'bench-press', names: { en: 'Bench Press' } },
        },
        {
          id: 'log-2',
          userId: 'user-1',
          exerciseId: 'ex-1',
          weight: 130,
          reps: 1,
          calculated1RM: 130,
          status: 'MANUAL_ENTRY',
          date: new Date('2026-06-01'),
          exercise: { id: 'ex-1', slug: 'bench-press', names: { en: 'Bench Press' } },
        },
      ]);
      const service = new MaxValuesService(prisma as never);

      const result = await service.getHistory('user-1', 'ex-1');

      expect(result).toHaveLength(2);
      expect(result[0]?.status).toBe('APPROVED');
      expect(result[1]?.status).toBe('MANUAL_ENTRY');
    });
  });
});
