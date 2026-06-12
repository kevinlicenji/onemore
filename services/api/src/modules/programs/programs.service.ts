import type {
  CreateProgramInput,
  ProgramDetail,
  ProgramSummary,
  TemplateMeta,
  TemplateSummary,
} from '@onemore/shared';
import { aggregateMuscleGroups, normalizeMuscleTags } from '@onemore/shared';
import type { Prisma, PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

/**
 * Program CRUD, version publishing, and template application.
 */
export class ProgramsService {
  /**
   * @param prisma - Database client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * List programs owned by the user.
   *
   * @param userId - Authenticated user id.
   */
  async listForUser(userId: string): Promise<ProgramSummary[]> {
    const [programs, activeAssignment] = await Promise.all([
      this.prisma.program.findMany({
        where: { ownerUserId: userId, deletedAt: null, isTemplate: false },
        orderBy: { updatedAt: 'desc' },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
            include: { workoutDays: true },
          },
        },
      }),
      this.prisma.programAssignment.findFirst({
        where: { clientUserId: userId, status: 'active' },
        include: { programVersion: { select: { programId: true } } },
      }),
    ]);

    const activeProgramId = activeAssignment?.programVersion.programId ?? null;

    return programs.map((program) => this.toSummary(program, program.id === activeProgramId));
  }

  /**
   * Get a program with its latest version detail.
   *
   * @param userId - Owner user id.
   * @param programId - Program id.
   */
  async getById(userId: string, programId: string): Promise<ProgramDetail> {
    const [program, activeAssignment] = await Promise.all([
      this.prisma.program.findFirst({
        where: { id: programId, ownerUserId: userId, deletedAt: null },
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
      }),
      this.prisma.programAssignment.findFirst({
        where: { clientUserId: userId, status: 'active' },
        include: { programVersion: { select: { programId: true } } },
      }),
    ]);

    if (!program) {
      throw new HttpError(404, 'Program not found', 'PROGRAM_NOT_FOUND');
    }

    const isActive = activeAssignment?.programVersion.programId === programId;
    return this.toDetail(program, isActive);
  }

  /**
   * Create a program with an initial draft version.
   *
   * @param userId - Owner user id.
   * @param input - Program structure.
   */
  async create(userId: string, input: CreateProgramInput): Promise<ProgramDetail> {
    await this.validateExerciseIds(
      userId,
      input.days.flatMap((day) => day.exercises.map((e) => e.exerciseLibraryId)),
    );

    const program = await this.prisma.$transaction(async (tx) => {
      const createdProgram = await tx.program.create({
        data: {
          ownerUserId: userId,
          name: input.name,
          description: input.description,
          objective: input.objective,
          durationWeeks: input.durationWeeks,
          authorType: 'self',
          isTemplate: false,
        },
      });

      const version = await tx.programVersion.create({
        data: {
          programId: createdProgram.id,
          versionNumber: 1,
          status: 'draft',
          changeReason: 'manual',
        },
      });

      await this.createDaysAndExercises(tx, version.id, input.days);

      return createdProgram.id;
    });

    return this.getById(userId, program);
  }

  /**
   * Publish the latest draft version (immutable after publish).
   *
   * @param userId - Owner user id.
   * @param programId - Program id.
   */
  async publish(userId: string, programId: string): Promise<ProgramDetail> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, ownerUserId: userId, deletedAt: null },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!program) {
      throw new HttpError(404, 'Program not found', 'PROGRAM_NOT_FOUND');
    }

    const latestVersion = program.versions[0];
    if (!latestVersion || latestVersion.status !== 'draft') {
      throw new HttpError(409, 'No draft version to publish', 'PROGRAM_NOT_DRAFT');
    }

    await this.prisma.programVersion.update({
      where: { id: latestVersion.id },
      data: { status: 'published', publishedAt: new Date() },
    });

    const detail = await this.getById(userId, programId);
    if (detail.versionId) {
      await this.assignPublishedProgramAsActive(userId, detail.versionId);
    }

    return detail;
  }

  /**
   * Replace program structure and publish a new version.
   *
   * @param userId - Owner user id.
   * @param programId - Program id.
   * @param input - Updated program structure.
   */
  async update(
    userId: string,
    programId: string,
    input: CreateProgramInput,
  ): Promise<ProgramDetail> {
    await this.validateExerciseIds(
      userId,
      input.days.flatMap((day) => day.exercises.map((e) => e.exerciseLibraryId)),
    );

    const program = await this.prisma.program.findFirst({
      where: { id: programId, ownerUserId: userId, deletedAt: null },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!program) {
      throw new HttpError(404, 'Program not found', 'PROGRAM_NOT_FOUND');
    }

    const latestVersion = program.versions[0];
    if (!latestVersion) {
      throw new HttpError(409, 'Program has no versions', 'PROGRAM_NO_VERSION');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.program.update({
        where: { id: programId },
        data: { name: input.name, description: input.description },
      });

      let versionId = latestVersion.id;
      if (latestVersion.status === 'published') {
        const nextVersion = await tx.programVersion.create({
          data: {
            programId,
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

    return this.publish(userId, programId);
  }

  /**
   * Soft-delete a program and pause its active assignment.
   *
   * @param userId - Owner user id.
   * @param programId - Program id.
   */
  async delete(userId: string, programId: string): Promise<void> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, ownerUserId: userId, deletedAt: null },
      include: { versions: { select: { id: true } } },
    });

    if (!program) {
      throw new HttpError(404, 'Program not found', 'PROGRAM_NOT_FOUND');
    }

    const versionIds = program.versions.map((version) => version.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.program.update({
        where: { id: programId },
        data: { deletedAt: new Date() },
      });

      if (versionIds.length > 0) {
        await tx.programAssignment.updateMany({
          where: {
            clientUserId: userId,
            programVersionId: { in: versionIds },
            status: 'active',
          },
          data: { status: 'paused' },
        });
      }
    });
  }

  /**
   * Set a published program as the user's only active assignment.
   *
   * @param userId - Owner user id.
   * @param programId - Program id.
   */
  async activate(userId: string, programId: string): Promise<ProgramDetail> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, ownerUserId: userId, deletedAt: null },
      include: {
        versions: {
          where: { status: 'published' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    const publishedVersion = program?.versions[0];
    if (!program || !publishedVersion) {
      throw new HttpError(404, 'Published program not found', 'PROGRAM_NOT_PUBLISHED');
    }

    await this.assignPublishedProgramAsActive(userId, publishedVersion.id);
    return this.getById(userId, programId);
  }

  private async assignPublishedProgramAsActive(
    userId: string,
    programVersionId: string,
  ): Promise<void> {
    const firstDay = await this.prisma.workoutDay.findFirst({
      where: { programVersionId },
      orderBy: { sortOrder: 'asc' },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.programAssignment.updateMany({
        where: { clientUserId: userId, status: 'active' },
        data: { status: 'paused' },
      });

      await tx.programAssignment.create({
        data: {
          programVersionId,
          clientUserId: userId,
          status: 'active',
          startedAt: new Date(),
          nextWorkoutDayId: firstDay?.id,
        },
      });
    });
  }

  /**
   * Get a published template with full day/exercise detail.
   *
   * @param templateSlug - Template key stored in program.name.
   */
  async getTemplateBySlug(templateSlug: string): Promise<ProgramDetail> {
    const template = await this.prisma.program.findFirst({
      where: { name: templateSlug, isTemplate: true, deletedAt: null },
      include: {
        versions: {
          where: { status: 'published' },
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

    const published = template?.versions[0];
    if (!template || !published) {
      throw new HttpError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
    }

    const meta = this.parseTemplateMeta(template.description);
    const detail = this.toDetail(template, false);
    return {
      ...detail,
      name: meta.displayName?.en ?? template.name,
      description: null,
      guide: meta.guide ?? null,
      isActive: false,
    };
  }

  /**
   * List published program templates.
   */
  async listTemplates(): Promise<TemplateSummary[]> {
    const templates = await this.prisma.program.findMany({
      where: { isTemplate: true, deletedAt: null },
      include: {
        versions: {
          where: { status: 'published' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { workoutDays: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return templates.map((template) => {
      const meta = this.parseTemplateMeta(template.description);
      const published = template.versions[0];
      return {
        slug: template.name,
        name: meta.displayName?.en ?? template.name,
        description: meta.displayName?.it ?? null,
        guide: meta.guide ?? null,
        objective: template.objective,
        daysPerWeek: meta.daysPerWeek ?? published?.workoutDays.length ?? 0,
        audience: meta.audience ?? 'general',
        equipmentProfile: meta.equipmentProfile ?? null,
        split: meta.split ?? null,
      };
    });
  }

  /**
   * Clone a template into the user's library and create an active assignment.
   *
   * @param userId - Authenticated user id.
   * @param templateSlug - Template key stored in program.name.
   */
  async applyTemplate(userId: string, templateSlug: string): Promise<ProgramDetail> {
    const template = await this.prisma.program.findFirst({
      where: { name: templateSlug, isTemplate: true, deletedAt: null },
      include: {
        versions: {
          where: { status: 'published' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            workoutDays: {
              orderBy: { sortOrder: 'asc' },
              include: {
                programExercises: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    const sourceVersion = template?.versions[0];
    if (!template || !sourceVersion) {
      throw new HttpError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
    }
    const meta = this.parseTemplateMeta(template.description);

    const programId = await this.prisma.$transaction(async (tx) => {
      const userProgram = await tx.program.create({
        data: {
          ownerUserId: userId,
          name: meta.displayName?.en ?? template.name,
          description: template.description,
          objective: template.objective,
          durationWeeks: template.durationWeeks,
          authorType: 'template',
          isTemplate: false,
        },
      });

      const version = await tx.programVersion.create({
        data: {
          programId: userProgram.id,
          versionNumber: 1,
          status: 'published',
          publishedAt: new Date(),
          changeReason: 'manual',
        },
      });

      const dayIdMap = new Map<string, string>();
      for (const day of sourceVersion.workoutDays) {
        const createdDay = await tx.workoutDay.create({
          data: {
            programVersionId: version.id,
            label: day.label,
            sortOrder: day.sortOrder,
          },
        });
        dayIdMap.set(day.id, createdDay.id);

        for (const exercise of day.programExercises) {
          await tx.programExercise.create({
            data: {
              workoutDayId: createdDay.id,
              exerciseLibraryId: exercise.exerciseLibraryId,
              sortOrder: exercise.sortOrder,
              targetSets: exercise.targetSets,
              targetReps: exercise.targetReps,
              targetWeightKg: exercise.targetWeightKg,
              restSeconds: exercise.restSeconds,
              targetRpe: exercise.targetRpe,
              targetRir: exercise.targetRir,
              progressionMode: exercise.progressionMode,
              progressionConfig: exercise.progressionConfig as Prisma.InputJsonValue,
              isWarmup: exercise.isWarmup,
              coachNote: exercise.coachNote,
            },
          });
        }
      }

      return { programId: userProgram.id, versionId: version.id };
    });

    await this.assignPublishedProgramAsActive(userId, programId.versionId);
    return this.getById(userId, programId.programId);
  }

  private async validateExerciseIds(userId: string, exerciseIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(exerciseIds)];
    const count = await this.prisma.exerciseLibrary.count({
      where: {
        id: { in: uniqueIds },
        deletedAt: null,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
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
      const workoutDay = await tx.workoutDay.create({
        data: {
          programVersionId: versionId,
          label: day.label,
          sortOrder: dayIndex,
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

  private toSummary(
    program: {
      id: string;
      name: string;
      description: string | null;
      objective: string | null;
      isTemplate: boolean;
      authorType: string;
      createdAt: Date;
      updatedAt: Date;
      versions: Array<{
        status: string;
        versionNumber: number;
        workoutDays: Array<{ id: string }>;
      }>;
    },
    isActive = false,
  ): ProgramSummary {
    const latest = program.versions[0];
    return {
      id: program.id,
      name: program.name,
      description: program.description,
      objective: program.objective as ProgramSummary['objective'],
      isTemplate: program.isTemplate,
      authorType: program.authorType as ProgramSummary['authorType'],
      latestVersionStatus: latest ? (latest.status as ProgramSummary['latestVersionStatus']) : null,
      latestVersionNumber: latest?.versionNumber ?? null,
      daysCount: latest?.workoutDays.length ?? 0,
      isActive,
      createdAt: program.createdAt.toISOString(),
      updatedAt: program.updatedAt.toISOString(),
    };
  }

  private toDetail(
    program: {
      id: string;
      name: string;
      description: string | null;
      objective: string | null;
      isTemplate: boolean;
      authorType: string;
      createdAt: Date;
      updatedAt: Date;
      versions: Array<{
        id: string;
        versionNumber: number;
        status: string;
        publishedAt: Date | null;
        workoutDays: Array<{
          id: string;
          label: string;
          sortOrder: number;
          programExercises: Array<{
            id: string;
            exerciseLibraryId: string;
            sortOrder: number;
            targetSets: number;
            targetReps: number;
            restSeconds: number;
            targetWeightKg: { toString(): string } | null;
            coachNote: string | null;
            exerciseLibrary: {
              id: string;
              slug: string;
              names: unknown;
              primaryMuscles: unknown;
            };
          }>;
        }>;
      }>;
    },
    isActive = false,
  ): ProgramDetail {
    const summary = this.toSummary(program, isActive);
    const version = program.versions[0];

    return {
      ...summary,
      versionId: version?.id ?? null,
      versionNumber: version?.versionNumber ?? null,
      versionStatus: version ? (version.status as ProgramDetail['versionStatus']) : null,
      publishedAt: version?.publishedAt?.toISOString() ?? null,
      days:
        version?.workoutDays.map((day) => {
          const exercises = day.programExercises.map((exercise) => ({
            id: exercise.id,
            exerciseLibraryId: exercise.exerciseLibraryId,
            sortOrder: exercise.sortOrder,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
            restSeconds: exercise.restSeconds,
            targetWeightKg: exercise.targetWeightKg ? Number(exercise.targetWeightKg) : null,
            coachNote: exercise.coachNote,
            exercise: {
              id: exercise.exerciseLibrary.id,
              slug: exercise.exerciseLibrary.slug,
              names: exercise.exerciseLibrary.names as { en: string; it?: string },
              primaryMuscles: normalizeMuscleTags(
                exercise.exerciseLibrary.primaryMuscles as string[],
              ),
            },
          }));

          return {
            id: day.id,
            label: day.label,
            sortOrder: day.sortOrder,
            muscleGroups: aggregateMuscleGroups(
              exercises.map((row) => ({ primaryMuscles: row.exercise.primaryMuscles })),
            ),
            exercises,
          };
        }) ?? [],
    };
  }
}
