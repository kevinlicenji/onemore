import { describe, expect, it, vi } from 'vitest';

import { HttpError } from '../../lib/errors.js';
import { AdminExercisesService } from './admin-exercises.service.js';

function createMockPrisma() {
  const systemExercise = {
    id: 'ex-1',
    slug: 'bench-press',
    names: { en: 'Bench Press', it: 'Panca piana' },
    description: null,
    category: 'chest',
    primaryMuscles: ['chest'],
    secondaryMuscles: [],
    equipment: 'barbell',
    isBodyweight: false,
    wgerId: null,
    ownerUserId: null,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  return {
    exerciseLibrary: {
      findMany: vi.fn(() => Promise.resolve([systemExercise])),
      findUnique: vi.fn(() => Promise.resolve(null)),
      findFirst: vi.fn(() => Promise.resolve(systemExercise)),
      create: vi.fn(() => Promise.resolve(systemExercise)),
      update: vi.fn(() => Promise.resolve(systemExercise)),
    },
  };
}

describe('AdminExercisesService', () => {
  it('lists system exercises including soft-deleted rows', async () => {
    const prisma = createMockPrisma();
    const service = new AdminExercisesService(prisma as never);

    const exercises = await service.list();

    expect(exercises).toHaveLength(1);
    expect(exercises[0]?.slug).toBe('bench-press');
    expect(prisma.exerciseLibrary.findMany).toHaveBeenCalledWith({
      where: { ownerUserId: null },
      orderBy: [{ deletedAt: 'asc' }, { slug: 'asc' }],
    });
  });

  it('rejects duplicate slug on create', async () => {
    const prisma = createMockPrisma();
    prisma.exerciseLibrary.findUnique.mockResolvedValueOnce({
      id: 'existing',
      slug: 'squat',
    } as never);
    const service = new AdminExercisesService(prisma as never);

    await expect(
      service.create({
        slug: 'squat',
        names: { en: 'Squat' },
        category: 'legs',
        primaryMuscles: ['quadriceps'],
        secondaryMuscles: [],
        equipment: 'barbell',
        isBodyweight: false,
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('soft-deletes a system exercise', async () => {
    const prisma = createMockPrisma();
    const deletedAt = new Date('2026-06-15');
    prisma.exerciseLibrary.update.mockResolvedValueOnce({
      id: 'ex-1',
      slug: 'bench-press',
      names: { en: 'Bench Press', it: 'Panca piana' },
      description: null,
      category: 'chest',
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      equipment: 'barbell',
      isBodyweight: false,
      wgerId: null,
      deletedAt,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-06-15'),
    } as never);
    const service = new AdminExercisesService(prisma as never);

    const result = await service.softDelete('ex-1');

    expect(result.deletedAt).toBe(deletedAt.toISOString());
    expect(prisma.exerciseLibrary.update).toHaveBeenCalledOnce();
    const calls = prisma.exerciseLibrary.update.mock.calls as unknown as Array<
      [{ where: { id: string }; data: { deletedAt: Date } }]
    >;
    const updateArgs = calls[0]?.[0];
    expect(updateArgs).toBeDefined();
    expect(updateArgs?.where.id).toBe('ex-1');
    expect(updateArgs?.data.deletedAt).toBeInstanceOf(Date);
  });
});
