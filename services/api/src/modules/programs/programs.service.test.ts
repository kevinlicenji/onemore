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
    programAssignment: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      updateMany: vi.fn(() => Promise.resolve({ count: 0 })),
      create: vi.fn(() => Promise.resolve({ id: 'assign-1' })),
    },
    workoutDay: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      deleteMany: vi.fn(() => Promise.resolve({ count: 0 })),
    },
    exerciseLibrary: {
      count: vi.fn(() => Promise.resolve(1)),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<string>) => callback({})),
  };
}

describe('ProgramsService', () => {
  it('throws when template slug is missing', async () => {
    const prisma = createMockPrisma();
    prisma.program.findFirst = vi.fn(() => Promise.resolve(null));
    const service = new ProgramsService(prisma as never);

    await expect(service.getTemplateBySlug('missing')).rejects.toThrow('Template not found');
  });

  it('lists programs for a user', async () => {
    const prisma = createMockPrisma();
    const service = new ProgramsService(prisma as never);

    const result = await service.listForUser('user-1');

    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe('My plan');
    expect(result[0]?.isActive).toBe(false);
  });
});
