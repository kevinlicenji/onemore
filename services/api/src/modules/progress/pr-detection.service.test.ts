import { describe, expect, it, vi } from 'vitest';

import { PrDetectionService } from './pr-detection.service.js';

function createMockTx() {
  const exercise = {
    id: 'ex-1',
    slug: 'bench-press',
    names: { en: 'Bench Press' },
  };

  return {
    exerciseLibrary: {
      findUnique: vi.fn(() => Promise.resolve(exercise)),
    },
    personalRecord: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      create: vi.fn((args: { data: { prType: string; value: number; reps?: number | null } }) =>
        Promise.resolve({
          id: 'pr-1',
          exerciseLibraryId: 'ex-1',
          prType: args.data.prType,
          reps: args.data.reps ?? null,
          value: args.data.value,
          achievedAt: new Date('2026-06-01T10:00:00.000Z'),
          exerciseLibrary: exercise,
        }),
      ),
      update: vi.fn(),
    },
    setLog: {
      findMany: vi.fn(() =>
        Promise.resolve([
          {
            id: 'set-1',
            weightKg: 100,
            reps: 5,
            isCompleted: true,
            isWarmup: false,
          },
        ]),
      ),
    },
  };
}

describe('PrDetectionService', () => {
  it('returns weight, volume, and e1rm PRs for a valid completed set', async () => {
    const tx = createMockTx();
    const service = new PrDetectionService();

    const records = await service.evaluateCompletedSet(tx as never, {
      userId: 'user-1',
      setLogId: 'set-1',
      exerciseLibraryId: 'ex-1',
      weightKg: 100,
      reps: 5,
      isWarmup: false,
      isCompleted: true,
      sessionId: 'session-1',
      achievedAt: new Date('2026-06-01T10:00:00.000Z'),
    });

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.prType)).toEqual(['weight_pr', 'volume_pr', 'e1rm_pr']);
    expect(records[2]?.value).toBeCloseTo(116.67, 2);
  });

  it('skips warmup sets', async () => {
    const tx = createMockTx();
    const service = new PrDetectionService();

    const records = await service.evaluateCompletedSet(tx as never, {
      userId: 'user-1',
      setLogId: 'set-1',
      exerciseLibraryId: 'ex-1',
      weightKg: 100,
      reps: 5,
      isWarmup: true,
      isCompleted: true,
      sessionId: 'session-1',
      achievedAt: new Date('2026-06-01T10:00:00.000Z'),
    });

    expect(records).toHaveLength(0);
  });
});
