import type {
  AdminCreateTemplate,
  AdminDuplicateTemplate,
  AdminTemplateDetail,
  AdminTemplateListItem,
  AdminUpdateTemplate,
  CreateProgramInput,
  ProgramDetail,
  TemplateMeta,
} from '@onemore/shared';
import {
  aggregateProgramDifficulty,
  computeDayDifficulty,
  normalizeMuscleTags,
} from '@onemore/shared';
import type { Prisma, PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

/**
 * Admin CRUD for catalog program templates (draft → publish workflow).
 */
export class AdminTemplatesService {
  /**
   * @param prisma - Database client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * List catalog templates with version status for the admin console.
   */
  async list(): Promise<AdminTemplateListItem[]> {
    const templates = await this.prisma.program.findMany({
      where: { isTemplate: true },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: { workoutDays: { select: { id: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return templates.map((template) => {
      const latest = template.versions[0] ?? null;
      const meta = this.parseTemplateMeta(template.description);
      const hasPublishedVersion = template.versions.some((version) => version.status === 'published');
      return {
        id: template.id,
        slug: template.name,
        displayName: meta.displayName?.en ?? template.name,
        objective: template.objective as AdminTemplateListItem['objective'],
        daysCount: latest?.workoutDays.length ?? 0,
        latestVersionStatus: latest
          ? (latest.status as AdminTemplateListItem['latestVersionStatus'])
          : null,
        latestVersionNumber: latest?.versionNumber ?? null,
        hasPublishedVersion,
        deletedAt: template.deletedAt?.toISOString() ?? null,
        updatedAt: template.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Load editable template detail (latest draft or published version).
   */
  async getBySlug(slug: string): Promise<AdminTemplateDetail> {
    const template = await this.requireTemplate(slug);
    const detail = await this.loadTemplateDetail(template.id);
    const meta = this.normalizeTemplateMeta(template.description);
    return {
      ...detail,
      slug: template.name,
      meta,
      name: meta.displayName?.en ?? template.name,
      description: null,
      guide: meta.guide ?? null,
      tagline: meta.tagline ?? null,
      isActive: false,
    };
  }

  /**
   * Create a new catalog template in draft state.
   */
  async create(input: AdminCreateTemplate): Promise<AdminTemplateDetail> {
    await this.assertSlugAvailable(input.slug);
    await this.validateExerciseIds(input.days.flatMap((day) => day.exercises.map((e) => e.exerciseLibraryId)));

    const ownerUserId = await this.resolveTemplateOwnerId();

    const programId = await this.prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
        data: {
          ownerUserId,
          name: input.slug,
          description: JSON.stringify(input.meta),
          objective: input.objective,
          authorType: 'template',
          isTemplate: true,
        },
      });

      const version = await tx.programVersion.create({
        data: {
          programId: created.id,
          versionNumber: 1,
          status: 'draft',
          changeReason: 'manual',
        },
      });

      await this.createDaysAndExercises(tx, version.id, input.days);
      return created.id;
    });

    return this.getBySlug(input.slug);
  }

  /**
   * Save template changes as draft without publishing.
   */
  async update(slug: string, input: AdminUpdateTemplate): Promise<AdminTemplateDetail> {
    const template = await this.requireTemplate(slug);
    const latestVersion = await this.latestVersion(template.id);

    if (input.days) {
      await this.validateExerciseIds(
        input.days.flatMap((day) => day.exercises.map((e) => e.exerciseLibraryId)),
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (input.meta || input.objective) {
        const currentMeta = this.parseTemplateMeta(template.description);
        await tx.program.update({
          where: { id: template.id },
          data: {
            ...(input.objective ? { objective: input.objective } : {}),
            ...(input.meta
              ? { description: JSON.stringify({ ...currentMeta, ...input.meta }) }
              : {}),
            deletedAt: null,
          },
        });
      }

      if (!input.days) {
        return;
      }

      let versionId = latestVersion.id;
      if (latestVersion.status === 'published') {
        const nextVersion = await tx.programVersion.create({
          data: {
            programId: template.id,
            versionNumber: latestVersion.versionNumber + 1,
            status: 'draft',
            changeReason: 'manual',
            previousVersionId: latestVersion.id,
          },
        });
        versionId = nextVersion.id;
      } else {
        await tx.workoutDay.deleteMany({ where: { programVersionId: latestVersion.id } });
      }

      await this.createDaysAndExercises(tx, versionId, input.days);
    });

    return this.getBySlug(slug);
  }

  /**
   * Duplicate an existing template under a new slug.
   */
  async duplicate(sourceSlug: string, input: AdminDuplicateTemplate): Promise<AdminTemplateDetail> {
    await this.assertSlugAvailable(input.slug);
    const source = await this.requireTemplate(sourceSlug);
    const sourceVersion = await this.latestVersionWithDays(source.id);
    const meta = this.normalizeTemplateMeta(source.description);
    const ownerUserId = await this.resolveTemplateOwnerId();

    const days = sourceVersion.workoutDays.map((day) => ({
      label: day.label,
      difficultyLevel: day.difficultyLevel as 1 | 2 | 3,
      exercises: day.programExercises.map((row) => ({
        exerciseLibraryId: row.exerciseLibraryId,
        targetSets: row.targetSets,
        targetReps: row.targetReps,
        restSeconds: row.restSeconds,
        targetWeightKg: row.targetWeightKg ? Number(row.targetWeightKg) : undefined,
        coachNote: row.coachNote ?? undefined,
      })),
    }));

    await this.validateExerciseIds(days.flatMap((day) => day.exercises.map((e) => e.exerciseLibraryId)));

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
        data: {
          ownerUserId,
          name: input.slug,
          description: JSON.stringify(meta),
          objective: source.objective,
          authorType: 'template',
          isTemplate: true,
        },
      });

      const version = await tx.programVersion.create({
        data: {
          programId: created.id,
          versionNumber: 1,
          status: 'draft',
          changeReason: 'manual',
        },
      });

      await this.createDaysAndExercises(tx, version.id, days);
    });

    return this.getBySlug(input.slug);
  }

  /**
   * Publish the latest draft version to the public catalog.
   */
  async publish(slug: string): Promise<AdminTemplateDetail> {
    const template = await this.requireTemplate(slug);
    const latestVersion = await this.latestVersion(template.id);

    if (latestVersion.status !== 'draft') {
      throw new HttpError(409, 'No draft version to publish', 'TEMPLATE_NOT_DRAFT');
    }

    await this.prisma.programVersion.update({
      where: { id: latestVersion.id },
      data: { status: 'published', publishedAt: new Date() },
    });

    return this.getBySlug(slug);
  }

  /**
   * Hide a template from the public catalog without deleting history.
   */
  async softDelete(slug: string): Promise<void> {
    const template = await this.requireTemplate(slug);
    await this.prisma.program.update({
      where: { id: template.id },
      data: { deletedAt: new Date() },
    });
  }

  private async requireTemplate(slug: string) {
    const template = await this.prisma.program.findFirst({
      where: { name: slug, isTemplate: true },
    });
    if (!template) {
      throw new HttpError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
    }
    return template;
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.prisma.program.findFirst({
      where: { name: slug, isTemplate: true, deletedAt: null },
    });
    if (existing) {
      throw new HttpError(409, 'Template slug already exists', 'TEMPLATE_SLUG_EXISTS');
    }
  }

  private async latestVersion(programId: string, withDays = false) {
    const version = await this.prisma.programVersion.findFirst({
      where: { programId },
      orderBy: { versionNumber: 'desc' },
      include: withDays
        ? {
            workoutDays: {
              orderBy: { sortOrder: 'asc' },
              include: {
                programExercises: { orderBy: { sortOrder: 'asc' } },
              },
            },
          }
        : undefined,
    });
    if (!version) {
      throw new HttpError(409, 'Template has no versions', 'TEMPLATE_NO_VERSION');
    }
    return version;
  }

  private async loadTemplateDetail(programId: string): Promise<ProgramDetail> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, isTemplate: true },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            workoutDays: {
              orderBy: { sortOrder: 'asc' },
              include: {
                programExercises: {
                  orderBy: { sortOrder: 'asc' },
                  include: { exerciseLibrary: true },
                },
              },
            },
          },
        },
      },
    });

    if (!program?.versions[0]) {
      throw new HttpError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
    }

    const latest = program.versions[0];
    const dayLevels = latest.workoutDays.map((day) => day.difficultyLevel);

    return {
      id: program.id,
      name: program.name,
      description: program.description,
      objective: program.objective as ProgramDetail['objective'],
      isTemplate: true,
      authorType: 'template',
      latestVersionStatus: latest.status as ProgramDetail['latestVersionStatus'],
      latestVersionNumber: latest.versionNumber,
      daysCount: latest.workoutDays.length,
      difficultyLevel: aggregateProgramDifficulty(dayLevels),
      isActive: false,
      versionId: latest.id,
      versionNumber: latest.versionNumber,
      versionStatus: latest.status as ProgramDetail['versionStatus'],
      publishedAt: latest.publishedAt?.toISOString() ?? null,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
      days: latest.workoutDays.map((day) => ({
        id: day.id,
        label: day.label,
        sortOrder: day.sortOrder,
        difficultyLevel: day.difficultyLevel as 1 | 2 | 3,
        muscleGroups: normalizeMuscleTags(
          day.programExercises.flatMap((row) => row.exerciseLibrary.primaryMuscles as string[]),
        ),
        exercises: day.programExercises.map((row) => ({
          id: row.id,
          exerciseLibraryId: row.exerciseLibraryId,
          sortOrder: row.sortOrder,
          targetSets: row.targetSets,
          targetReps: row.targetReps,
          restSeconds: row.restSeconds,
          targetWeightKg: row.targetWeightKg ? Number(row.targetWeightKg) : null,
          coachNote: row.coachNote,
          exercise: {
            id: row.exerciseLibrary.id,
            slug: row.exerciseLibrary.slug,
            names: row.exerciseLibrary.names as { en: string; it?: string },
            primaryMuscles: normalizeMuscleTags(row.exerciseLibrary.primaryMuscles as string[]),
          },
        })),
      })),
    };
  }

  private async resolveTemplateOwnerId(): Promise<string> {
    const systemUser = await this.prisma.user.findUnique({ where: { email: 'system@onemore.app' } });
    if (systemUser) {
      return systemUser.id;
    }
    const admin = await this.prisma.user.findFirst({ where: { isAdmin: true, deletedAt: null } });
    if (!admin) {
      throw new HttpError(500, 'No system owner available for templates', 'TEMPLATE_OWNER_MISSING');
    }
    return admin.id;
  }

  private async validateExerciseIds(exerciseIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(exerciseIds)];
    if (uniqueIds.length === 0) {
      return;
    }
    const count = await this.prisma.exerciseLibrary.count({
      where: {
        id: { in: uniqueIds },
        ownerUserId: null,
        deletedAt: null,
      },
    });
    if (count !== uniqueIds.length) {
      throw new HttpError(400, 'One or more exercises are invalid', 'EXERCISE_NOT_FOUND');
    }
  }

  private async createDaysAndExercises(
    tx: Prisma.TransactionClient,
    versionId: string,
    days: CreateProgramInput['days'],
  ): Promise<void> {
    for (const [dayIndex, day] of days.entries()) {
      const difficultyLevel =
        day.difficultyLevel ??
        computeDayDifficulty(
          day.exercises.map((exercise) => ({
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            restSeconds: exercise.restSeconds,
          })),
        );

      const workoutDay = await tx.workoutDay.create({
        data: {
          programVersionId: versionId,
          label: day.label,
          sortOrder: dayIndex,
          difficultyLevel,
        },
      });

      for (const [exerciseIndex, exercise] of day.exercises.entries()) {
        await tx.programExercise.create({
          data: {
            workoutDayId: workoutDay.id,
            exerciseLibraryId: exercise.exerciseLibraryId,
            sortOrder: exerciseIndex,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            restSeconds: exercise.restSeconds,
            targetWeightKg: exercise.targetWeightKg,
            coachNote: exercise.coachNote,
          },
        });
      }
    }
  }

  private async latestVersionWithDays(programId: string) {
    const version = await this.prisma.programVersion.findFirst({
      where: { programId },
      orderBy: { versionNumber: 'desc' },
      include: {
        workoutDays: {
          orderBy: { sortOrder: 'asc' },
          include: {
            programExercises: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    if (!version) {
      throw new HttpError(409, 'Template has no versions', 'TEMPLATE_NO_VERSION');
    }
    return version;
  }

  private normalizeTemplateMeta(description: string | null): TemplateMeta {
    const parsed = this.parseTemplateMeta(description);
    return {
      displayName: parsed.displayName ?? { en: '', it: '' },
      audience: parsed.audience ?? 'intermediate',
      daysPerWeek: parsed.daysPerWeek ?? 3,
      guide: parsed.guide ?? { en: '', it: '' },
      equipmentProfile: parsed.equipmentProfile,
      split: parsed.split,
      tags: parsed.tags,
      tagline: parsed.tagline,
    };
  }

  private parseTemplateMeta(description: string | null): Partial<TemplateMeta> {
    if (!description) {
      return {};
    }
    try {
      return JSON.parse(description) as Partial<TemplateMeta>;
    } catch {
      return { displayName: { en: description } };
    }
  }
}
