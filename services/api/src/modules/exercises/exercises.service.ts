import type { CreateCustomExercise, ExerciseListItem, ExerciseSearchQuery } from '@onemore/shared';
import { equipmentTypesForGroup, normalizeMuscleTags } from '@onemore/shared';
import type { Prisma, PrismaClient } from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';

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
      return this.search(userId, query);
    }

    const exercises = await this.prisma.exerciseLibrary.findMany({
      where: this.buildWhere(userId, query),
      orderBy: [{ category: 'asc' }, { slug: 'asc' }],
      take: query.limit,
    });

    return exercises.map((exercise) => this.toListItem(exercise, userId));
  }

  /**
   * Full-text search using Postgres tsvector with optional filters.
   *
   * @param userId - Authenticated user id.
   * @param query - Search term and filters.
   */
  async search(userId: string, query: ExerciseSearchQuery): Promise<ExerciseListItem[]> {
    const term = query.q;
    if (!term) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<ExerciseRow[]>`
      SELECT id, slug, names, category, primary_muscles, secondary_muscles, equipment, is_bodyweight, owner_user_id
      FROM exercise_library
      WHERE deleted_at IS NULL
        AND (owner_user_id IS NULL OR owner_user_id = ${userId}::uuid)
        AND search_vector @@ plainto_tsquery('english', ${term})
        ${this.buildSqlFilters(query)}
      ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${term})) DESC
      LIMIT ${query.limit}
    `;

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      names: row.names,
      category: row.category,
      primaryMuscles: normalizeMuscleTags(row.primary_muscles),
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

    const primaryMuscles = normalizeMuscleTags(input.primaryMuscles);

    const created = await this.prisma.exerciseLibrary.create({
      data: {
        slug,
        names: input.names,
        category: input.category,
        primaryMuscles,
        secondaryMuscles: input.secondaryMuscles,
        equipment: input.equipment,
        isBodyweight: input.isBodyweight,
        ownerUserId: userId,
      },
    });

    return this.toListItem(created, userId);
  }

  /**
   * Update a user-owned custom exercise.
   *
   * @param userId - Owner user id.
   * @param exerciseId - Exercise library id.
   * @param input - Fields to update.
   */
  async updateCustom(
    userId: string,
    exerciseId: string,
    input: { isBodyweight: boolean },
  ): Promise<ExerciseListItem> {
    const exercise = await this.prisma.exerciseLibrary.findFirst({
      where: { id: exerciseId, ownerUserId: userId, deletedAt: null },
    });

    if (!exercise) {
      throw new HttpError(404, 'Custom exercise not found', 'EXERCISE_NOT_FOUND');
    }

    const updated = await this.prisma.exerciseLibrary.update({
      where: { id: exerciseId },
      data: {
        isBodyweight: input.isBodyweight,
        equipment: input.isBodyweight ? 'bodyweight' : exercise.equipment,
      },
    });

    return this.toListItem(updated, userId);
  }

  private buildWhere(userId: string, query: ExerciseSearchQuery): Prisma.ExerciseLibraryWhereInput {
    const where: Prisma.ExerciseLibraryWhereInput = {
      deletedAt: null,
      OR: [{ ownerUserId: null }, { ownerUserId: userId }],
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.isBodyweight !== undefined) {
      where.isBodyweight = query.isBodyweight;
    }

    if (query.equipmentGroup) {
      where.equipment = { in: equipmentTypesForGroup(query.equipmentGroup) };
    } else if (query.equipment) {
      where.equipment = query.equipment;
    }

    if (query.muscle) {
      where.primaryMuscles = { string_contains: `"${query.muscle}"` };
    }

    return where;
  }

  private buildSqlFilters(query: ExerciseSearchQuery): PrismaNamespace.Sql {
    const parts: PrismaNamespace.Sql[] = [];

    if (query.category) {
      parts.push(PrismaNamespace.sql`AND category = ${query.category}`);
    }

    if (query.isBodyweight !== undefined) {
      parts.push(PrismaNamespace.sql`AND is_bodyweight = ${query.isBodyweight}`);
    }

    if (query.equipmentGroup) {
      const equipmentTypes = equipmentTypesForGroup(query.equipmentGroup);
      parts.push(PrismaNamespace.sql`AND equipment IN (${PrismaNamespace.join(equipmentTypes)})`);
    } else if (query.equipment) {
      parts.push(PrismaNamespace.sql`AND equipment = ${query.equipment}`);
    }

    if (query.muscle) {
      parts.push(
        PrismaNamespace.sql`AND primary_muscles @> ${JSON.stringify([query.muscle])}::jsonb`,
      );
    }

    if (parts.length === 0) {
      return PrismaNamespace.empty;
    }

    return PrismaNamespace.join(parts, ' ');
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
    const primaryMuscles = normalizeMuscleTags(exercise.primaryMuscles as string[]);
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
