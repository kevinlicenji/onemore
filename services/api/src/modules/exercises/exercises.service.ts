import type { CreateCustomExercise, ExerciseListItem, ExerciseSearchQuery } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';
import { slugify } from '../../lib/slug.js';

interface ExerciseRow {
  id: string;
  slug: string;
  names: { en: string; it?: string };
  category: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string;
  is_bodyweight: boolean;
  owner_user_id: string | null;
}

/**
 * Exercise catalog list, search, and custom exercise creation.
 */
export class ExercisesService {
  /**
   * @param prisma - Database client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * List or search exercises visible to the user.
   *
   * @param userId - Authenticated user id.
   * @param query - Search filters.
   * @returns Matching exercises.
   */
  async list(userId: string, query: ExerciseSearchQuery): Promise<ExerciseListItem[]> {
    if (query.q) {
      return this.search(userId, query.q, query.limit);
    }

    const exercises = await this.prisma.exerciseLibrary.findMany({
      where: {
        deletedAt: null,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
        ...(query.category ? { category: query.category } : {}),
      },
      orderBy: [{ category: 'asc' }, { slug: 'asc' }],
      take: query.limit,
    });

    return exercises.map((exercise) => this.toListItem(exercise, userId));
  }

  /**
   * Full-text search using Postgres tsvector.
   *
   * @param userId - Authenticated user id.
   * @param term - Search term.
   * @param limit - Max results.
   */
  async search(userId: string, term: string, limit: number): Promise<ExerciseListItem[]> {
    const rows = await this.prisma.$queryRaw<ExerciseRow[]>`
      SELECT id, slug, names, category, primary_muscles, secondary_muscles, equipment, is_bodyweight, owner_user_id
      FROM exercise_library
      WHERE deleted_at IS NULL
        AND (owner_user_id IS NULL OR owner_user_id = ${userId}::uuid)
        AND search_vector @@ plainto_tsquery('english', ${term})
      ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${term})) DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      names: row.names,
      category: row.category,
      primaryMuscles: row.primary_muscles,
      secondaryMuscles: row.secondary_muscles,
      equipment: row.equipment,
      isBodyweight: row.is_bodyweight,
      isCustom: row.owner_user_id !== null,
    }));
  }

  /**
   * Create a user-owned custom exercise.
   *
   * @param userId - Owner user id.
   * @param input - Exercise payload.
   */
  async createCustom(userId: string, input: CreateCustomExercise): Promise<ExerciseListItem> {
    const baseSlug = slugify(input.names.en);
    const slug = `${baseSlug}-custom-${userId.slice(0, 8)}`;

    const existing = await this.prisma.exerciseLibrary.findUnique({ where: { slug } });
    if (existing) {
      throw new HttpError(409, 'Custom exercise slug already exists', 'EXERCISE_SLUG_EXISTS');
    }

    const created = await this.prisma.exerciseLibrary.create({
      data: {
        slug,
        names: input.names,
        category: input.category,
        primaryMuscles: input.primaryMuscles,
        secondaryMuscles: input.secondaryMuscles,
        equipment: input.equipment,
        isBodyweight: input.isBodyweight,
        ownerUserId: userId,
      },
    });

    return this.toListItem(created, userId);
  }

  private toListItem(
    exercise: {
      id: string;
      slug: string;
      names: unknown;
      category: string;
      primaryMuscles: unknown;
      secondaryMuscles: unknown;
      equipment: string;
      isBodyweight: boolean;
      ownerUserId: string | null;
    },
    userId: string,
  ): ExerciseListItem {
    const names = exercise.names as { en: string; it?: string };
    const primaryMuscles = exercise.primaryMuscles as string[];
    const secondaryMuscles = exercise.secondaryMuscles as string[];

    return {
      id: exercise.id,
      slug: exercise.slug,
      names,
      category: exercise.category,
      primaryMuscles,
      secondaryMuscles,
      equipment: exercise.equipment,
      isBodyweight: exercise.isBodyweight,
      isCustom: exercise.ownerUserId === userId,
    };
  }
}
