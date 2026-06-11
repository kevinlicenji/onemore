import { describe, expect, it, vi } from 'vitest';

import { ExercisesService } from './exercises.service.js';

function createMockPrisma() {
  const exercises = [
    {
      id: 'ex-1',
      slug: 'bench-press',
      names: { en: 'Bench Press' },
      category: 'chest',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      equipment: 'barbell',
      isBodyweight: false,
      ownerUserId: null,
      deletedAt: null,
    },
  ];

  return {
    exerciseLibrary: {
      findMany: vi.fn(() => Promise.resolve(exercises)),
      findUnique: vi.fn(() => Promise.resolve(null)),
      create: vi.fn(() =>
        Promise.resolve({
          id: 'ex-custom',
          slug: 'my-press-custom-user-1',
          names: { en: 'My press' },
          category: 'chest',
          primaryMuscles: ['chest'],
          secondaryMuscles: [],
          equipment: 'dumbbell',
          isBodyweight: false,
          ownerUserId: 'user-1',
        }),
      ),
    },
    $queryRaw: vi.fn(() => Promise.resolve([])),
  };
}

describe('ExercisesService', () => {
  it('lists catalog exercises for a user', async () => {
    const prisma = createMockPrisma();
    const service = new ExercisesService(prisma as never);

    const result = await service.list('user-1', { limit: 10 });

    expect(result.length).toBe(1);
    expect(result[0]?.slug).toBe('bench-press');
    expect(prisma.exerciseLibrary.findMany).toHaveBeenCalled();
  });

  it('creates a custom exercise', async () => {
    const prisma = createMockPrisma();
    const service = new ExercisesService(prisma as never);

    const result = await service.createCustom('user-1', {
      names: { en: 'My press' },
      category: 'chest',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      equipment: 'dumbbell',
      isBodyweight: false,
    });

    expect(result.isCustom).toBe(true);
    expect(prisma.exerciseLibrary.create).toHaveBeenCalled();
  });
});
