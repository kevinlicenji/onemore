import type {
  InsertManualMaxInput,
  UserExerciseMaxWithExercise,
  MaxHistoryLogWithExercise,
} from '@onemore/shared';
import { computeE1rm, roundPrValue } from '@onemore/shared';
import type { PrismaClient, Prisma } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

type TransactionClient = Prisma.TransactionClient;

export interface EvaluateSetInput {
  userId: string;
  exerciseLibraryId: string;
  weightKg: number;
  reps: number;
  rpe?: number | null;
  rir?: number | null;
  isWarmup: boolean;
  achievedAt: Date;
}

export interface PendingApprovalResult {
  logId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  calculated1RM: number;
}

export class MaxValuesService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Evaluate a completed set for potential 1RM record.
   * Called from workout upsertSet inside a transaction.
   */
  async evaluateSet(
    tx: TransactionClient,
    input: EvaluateSetInput,
  ): Promise<PendingApprovalResult | null> {
    const { userId, exerciseLibraryId, weightKg, reps, rpe, rir, isWarmup } = input;

    if (isWarmup || weightKg <= 0 || reps <= 0) {
      return null;
    }

    if (reps > 10) {
      return null;
    }

    const hasValidRpe = rpe !== null && rpe !== undefined && rpe >= 8;
    const hasValidRir = rir !== null && rir !== undefined && rir <= 2;
    if (!hasValidRpe && !hasValidRir) {
      return null;
    }

    const calculated1RM = computeE1rm(weightKg, reps);
    if (calculated1RM === null) {
      return null;
    }

    const rounded1RM = roundPrValue(calculated1RM);

    const existing = await tx.userExerciseMax.findUnique({
      where: {
        userId_exerciseId: {
          userId,
          exerciseId: exerciseLibraryId,
        },
      },
    });

    if (existing && rounded1RM <= existing.weight) {
      return null;
    }

    const existingPending = await tx.maxHistoryLog.findFirst({
      where: {
        userId,
        exerciseId: exerciseLibraryId,
        status: 'PENDING_APPROVAL',
        calculated1RM: { gte: rounded1RM - 0.01, lte: rounded1RM + 0.01 },
      },
    });
    if (existingPending) {
      return null;
    }

    const log = await tx.maxHistoryLog.create({
      data: {
        userId,
        exerciseId: exerciseLibraryId,
        weight: weightKg,
        reps,
        calculated1RM: rounded1RM,
        status: 'PENDING_APPROVAL',
        date: input.achievedAt,
      },
    });

    return {
      logId: log.id,
      exerciseId: exerciseLibraryId,
      weight: weightKg,
      reps,
      calculated1RM: rounded1RM,
    };
  }

  /**
   * List active max values for a user, ordered by exercise name.
   */
  async listActive(userId: string): Promise<UserExerciseMaxWithExercise[]> {
    const rows = await this.prisma.userExerciseMax.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { exercise: { slug: 'asc' } },
    });

    return rows.map((row) => this.toMaxWithExercise(row));
  }

  /**
   * Insert a manual max value (upsert).
   */
  async insertManual(
    userId: string,
    input: InsertManualMaxInput,
  ): Promise<UserExerciseMaxWithExercise> {
    const exercise = await this.prisma.exerciseLibrary.findUnique({
      where: { id: input.exerciseId },
    });
    if (!exercise) {
      throw new HttpError(404, 'Exercise not found', 'EXERCISE_NOT_FOUND');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const max = await tx.userExerciseMax.upsert({
        where: {
          userId_exerciseId: {
            userId,
            exerciseId: input.exerciseId,
          },
        },
        create: {
          userId,
          exerciseId: input.exerciseId,
          weight: input.weight,
          source: 'MANUAL',
        },
        update: {
          weight: input.weight,
          source: 'MANUAL',
        },
        include: { exercise: true },
      });

      await tx.maxHistoryLog.create({
        data: {
          userId,
          exerciseId: input.exerciseId,
          weight: input.weight,
          reps: 1,
          calculated1RM: input.weight,
          status: 'MANUAL_ENTRY',
          date: new Date(),
        },
      });

      return max;
    });

    return this.toMaxWithExercise(row);
  }

  /**
   * List pending approval records for a user.
   */
  async listPending(userId: string): Promise<MaxHistoryLogWithExercise[]> {
    const rows = await this.prisma.maxHistoryLog.findMany({
      where: {
        userId,
        status: 'PENDING_APPROVAL',
      },
      include: { exercise: true },
      orderBy: { date: 'desc' },
    });

    return rows.map((row) => this.toHistoryWithExercise(row));
  }

  /**
   * Resolve a pending max proposal.
   */
  async resolvePending(userId: string, logId: string, action: 'APPROVE' | 'REJECT'): Promise<void> {
    const log = await this.prisma.maxHistoryLog.findUnique({
      where: { id: logId },
    });

    if (!log || log.userId !== userId) {
      throw new HttpError(404, 'Pending log not found', 'LOG_NOT_FOUND');
    }

    if (log.status !== 'PENDING_APPROVAL') {
      throw new HttpError(409, 'Log is not pending approval', 'LOG_NOT_PENDING');
    }

    if (action === 'APPROVE') {
      await this.prisma.$transaction(async (tx) => {
        await tx.maxHistoryLog.update({
          where: { id: logId },
          data: { status: 'APPROVED' },
        });

        await tx.userExerciseMax.upsert({
          where: {
            userId_exerciseId: {
              userId,
              exerciseId: log.exerciseId,
            },
          },
          create: {
            userId,
            exerciseId: log.exerciseId,
            weight: log.calculated1RM,
            source: 'AUTOMATIC_APPROVED',
          },
          update: {
            weight: log.calculated1RM,
            source: 'AUTOMATIC_APPROVED',
          },
        });
      });
    } else {
      await this.prisma.maxHistoryLog.update({
        where: { id: logId },
        data: { status: 'REJECTED' },
      });
    }
  }

  /**
   * Get history logs for an exercise (for charts).
   */
  async getHistory(userId: string, exerciseId: string): Promise<MaxHistoryLogWithExercise[]> {
    const rows = await this.prisma.maxHistoryLog.findMany({
      where: {
        userId,
        exerciseId,
        status: { in: ['APPROVED', 'MANUAL_ENTRY'] },
      },
      include: { exercise: true },
      orderBy: { date: 'asc' },
    });

    return rows.map((row) => this.toHistoryWithExercise(row));
  }

  private toMaxWithExercise(row: {
    id: string;
    userId: string;
    exerciseId: string;
    weight: number;
    source: string;
    createdAt: Date;
    updatedAt: Date;
    exercise: { id: string; slug: string; names: unknown };
  }): UserExerciseMaxWithExercise {
    const names = row.exercise.names as { en: string; it?: string };
    return {
      id: row.id,
      userId: row.userId,
      exerciseId: row.exerciseId,
      weight: row.weight,
      source: row.source as UserExerciseMaxWithExercise['source'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      exercise: {
        id: row.exercise.id,
        slug: row.exercise.slug,
        names,
      },
    };
  }

  private toHistoryWithExercise(row: {
    id: string;
    userId: string;
    exerciseId: string;
    weight: number;
    reps: number;
    calculated1RM: number;
    status: string;
    date: Date;
    exercise: { id: string; slug: string; names: unknown };
  }): MaxHistoryLogWithExercise {
    const names = row.exercise.names as { en: string; it?: string };
    return {
      id: row.id,
      userId: row.userId,
      exerciseId: row.exerciseId,
      weight: row.weight,
      reps: row.reps,
      calculated1RM: row.calculated1RM,
      status: row.status as MaxHistoryLogWithExercise['status'],
      date: row.date.toISOString(),
      exercise: {
        id: row.exercise.id,
        slug: row.exercise.slug,
        names,
      },
    };
  }
}
