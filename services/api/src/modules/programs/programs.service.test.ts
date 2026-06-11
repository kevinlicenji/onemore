import { describe, expect, it, vi } from 'vitest';

import { ProgramsService } from './programs.service.js';

function createMockPrisma() {
  const programs = [
    {
      id: 'prog-1',
      name: 'My plan',
      description: null,
      objective: 'fitness',
      isTemplate: false,
      authorType: 'self',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      versions: [
        {
          status: 'draft',
          versionNumber: 1,
          workoutDays: [{ id: 'day-1' }],
        },
      ],
    },
  ];

  return {
    program: {
      findMany: vi.fn(() => Promise.resolve(programs)),
      findFirst: vi.fn(() => Promise.resolve(null)),
      count: vi.fn(() => Promise.resolve(1)),
    },
    exerciseLibrary: {
      count: vi.fn(() => Promise.resolve(1)),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<string>) => callback({})),
  };
}

describe('ProgramsService', () => {
  it('lists programs for a user', async () => {
    const prisma = createMockPrisma();
    const service = new ProgramsService(prisma as never);

    const result = await service.listForUser('user-1');

    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe('My plan');
  });
});
