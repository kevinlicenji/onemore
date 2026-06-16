import { describe, expect, it, vi } from 'vitest';

import { SyncService } from './sync.service.js';

function createMockPrisma() {
  const syncIdempotency = {
    findUnique: vi.fn<() => Promise<{ responseBody: unknown } | null>>(() => Promise.resolve(null)),
    create: vi.fn(() => Promise.resolve({})),
  };

  return {
    syncIdempotency,
    exerciseLibrary: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
    workoutSession: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback({})),
  };
}

describe('SyncService', () => {
  it('returns cached idempotent batch response', async () => {
    const cachedResponse = {
      serverTime: '2026-06-10T10:00:00.000Z',
      acknowledged: ['550e8400-e29b-41d4-a716-446655440000'],
      conflicts: [],
    };
    const prisma = createMockPrisma();
    prisma.syncIdempotency.findUnique.mockResolvedValue({ responseBody: cachedResponse });
    const workoutsService = {
      getNextWorkoutPreview: vi.fn(),
      getSession: vi.fn(),
    };
    const prDetection = { evaluateCompletedSet: vi.fn(() => Promise.resolve([])) };
    const maxValuesService = { evaluateSet: vi.fn(() => Promise.resolve(null)) };
    const service = new SyncService(
      prisma as never,
      workoutsService as never,
      prDetection as never,
      maxValuesService as never,
    );

    const result = await service.processBatch('user-1', 'idem-1', {
      clientSyncId: '550e8400-e29b-41d4-a716-446655440099',
      mutations: [],
    });

    expect(result).toEqual(cachedResponse);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
