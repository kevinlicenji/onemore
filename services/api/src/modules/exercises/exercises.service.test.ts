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
  };
}

describe('ExercisesService', () => {
  it('lists catalog exercises for a user in alphabetical order', async () => {
    const prisma = createMockPrisma();
    prisma.exerciseLibrary.findMany.mockResolvedValueOnce([
      {
        id: 'ex-2',
        slug: 'squat',
        names: { en: 'Squat' },
        category: 'legs',
        primaryMuscles: ['quadriceps'],
        secondaryMuscles: [],
        equipment: 'barbell',
        isBodyweight: false,
        ownerUserId: null,
        deletedAt: null,
      },
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
    ]);
    const service = new ExercisesService(prisma as never);

    const result = await service.list('user-1', { limit: 10 });

    expect(result.map((item) => item.names.en)).toEqual(['Bench Press', 'Squat']);
    expect(prisma.exerciseLibrary.findMany).toHaveBeenCalled();
  });

  it('applies category filter when listing', async () => {
    const prisma = createMockPrisma();
    const service = new ExercisesService(prisma as never);

    await service.list('user-1', { limit: 10, category: 'legs', equipmentGroup: 'machines' });

    type ListArgs = { where?: { category?: string; equipment?: { in: string[] } } };
    const calls = prisma.exerciseLibrary.findMany.mock.calls as unknown as Array<[ListArgs]>;
    const listArgs = calls[0]?.[0];
    expect(listArgs?.where?.category).toBe('legs');
    expect(listArgs?.where?.equipment).toEqual({ in: ['machine', 'smith_machine'] });
  });

  it('applies muscle filter when listing', async () => {
    const prisma = createMockPrisma();
    const service = new ExercisesService(prisma as never);

    await service.list('user-1', { limit: 10, muscle: 'hamstrings' });

    type ListArgs = { where?: { primaryMuscles?: { string_contains: string } } };
    const calls = prisma.exerciseLibrary.findMany.mock.calls as unknown as Array<[ListArgs]>;
    const listArgs = calls[0]?.[0];
    expect(listArgs?.where?.primaryMuscles).toEqual({ string_contains: '"hamstrings"' });
  });

  it('searches exercises with substring match and alphabetical order', async () => {
    const prisma = createMockPrisma();
    prisma.exerciseLibrary.findMany.mockResolvedValueOnce([
      {
        id: 'ex-1',
        slug: 'hip-abductor-machine',
        names: { en: 'Hip Abductor Machine' },
        category: 'legs',
        primaryMuscles: ['glutes'],
        secondaryMuscles: [],
        equipment: 'machine',
        isBodyweight: false,
        ownerUserId: null,
        deletedAt: null,
      },
      {
        id: 'ex-2',
        slug: 'hip-thrust-machine',
        names: { en: 'Hip Thrust Machine' },
        category: 'legs',
        primaryMuscles: ['glutes'],
        secondaryMuscles: [],
        equipment: 'machine',
        isBodyweight: false,
        ownerUserId: null,
        deletedAt: null,
      },
    ]);
    const service = new ExercisesService(prisma as never);

    const result = await service.search('user-1', { q: 'Thru', limit: 10 });

    expect(result.map((item) => item.names.en)).toEqual(['Hip Thrust Machine']);
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
