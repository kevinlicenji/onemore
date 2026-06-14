import type {
  AdminCreateSystemExercise,
  AdminSystemExercise,
  AdminUpdateSystemExercise,
} from '@onemore/shared';
import { normalizeMuscleTags } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

/**
 * Admin CRUD for global (system-owned) exercise catalog entries.
 */
export class AdminExercisesService {
  /**
   * @param prisma - Database client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * List all system exercises, including soft-deleted rows.
   */
  async list(): Promise<AdminSystemExercise[]> {
    const rows = await this.prisma.exerciseLibrary.findMany({
      where: { ownerUserId: null },
      orderBy: [{ deletedAt: 'asc' }, { slug: 'asc' }],
    });
    return rows.map((row) => this.toAdminExercise(row));
  }

  /**
   * Create a new global exercise visible to all users.
   */
  async create(input: AdminCreateSystemExercise): Promise<AdminSystemExercise> {
    const existing = await this.prisma.exerciseLibrary.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new HttpError(409, 'Exercise slug already exists', 'EXERCISE_SLUG_EXISTS');
    }

    const created = await this.prisma.exerciseLibrary.create({
      data: {
        slug: input.slug,
        names: input.names,
        description: input.description ?? undefined,
        category: input.category,
        primaryMuscles: normalizeMuscleTags(input.primaryMuscles),
        secondaryMuscles: input.secondaryMuscles,
        equipment: input.equipment,
        isBodyweight: input.isBodyweight,
        wgerId: input.wgerId,
        ownerUserId: null,
      },
    });

    return this.toAdminExercise(created);
  }

  /**
   * Update a global exercise. Restores visibility when updating a soft-deleted row.
   */
  async update(exerciseId: string, input: AdminUpdateSystemExercise): Promise<AdminSystemExercise> {
    const exercise = await this.requireSystemExercise(exerciseId);

    const updated = await this.prisma.exerciseLibrary.update({
      where: { id: exercise.id },
      data: {
        ...(input.names ? { names: input.names } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.primaryMuscles
          ? { primaryMuscles: normalizeMuscleTags(input.primaryMuscles) }
          : {}),
        ...(input.secondaryMuscles ? { secondaryMuscles: input.secondaryMuscles } : {}),
        ...(input.equipment ? { equipment: input.equipment } : {}),
        ...(input.isBodyweight !== undefined ? { isBodyweight: input.isBodyweight } : {}),
        ...(input.wgerId !== undefined ? { wgerId: input.wgerId } : {}),
        deletedAt: null,
      },
    });

    return this.toAdminExercise(updated);
  }

  /**
   * Soft-delete a global exercise so it no longer appears in pickers.
   */
  async softDelete(exerciseId: string): Promise<AdminSystemExercise> {
    const exercise = await this.requireSystemExercise(exerciseId);
    const updated = await this.prisma.exerciseLibrary.update({
      where: { id: exercise.id },
      data: { deletedAt: new Date() },
    });
    return this.toAdminExercise(updated);
  }

  private async requireSystemExercise(exerciseId: string) {
    const exercise = await this.prisma.exerciseLibrary.findFirst({
      where: { id: exerciseId, ownerUserId: null },
    });
    if (!exercise) {
      throw new HttpError(404, 'System exercise not found', 'EXERCISE_NOT_FOUND');
    }
    return exercise;
  }

  private toAdminExercise(exercise: {
    id: string;
    slug: string;
    names: unknown;
    description: unknown;
    category: string;
    primaryMuscles: unknown;
    secondaryMuscles: unknown;
    equipment: string;
    isBodyweight: boolean;
    wgerId: number | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminSystemExercise {
    return {
      id: exercise.id,
      slug: exercise.slug,
      names: exercise.names as AdminSystemExercise['names'],
      description: (exercise.description as AdminSystemExercise['description']) ?? null,
      category: exercise.category,
      primaryMuscles: exercise.primaryMuscles as string[],
      secondaryMuscles: exercise.secondaryMuscles as string[],
      equipment: exercise.equipment,
      isBodyweight: exercise.isBodyweight,
      wgerId: exercise.wgerId,
      deletedAt: exercise.deletedAt?.toISOString() ?? null,
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString(),
    };
  }
}
