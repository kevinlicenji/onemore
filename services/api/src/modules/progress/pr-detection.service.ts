import type { PersonalRecordSummary, PrType } from '@onemore/shared';
import { computeE1rm, computeSetVolume, roundPrValue } from '@onemore/shared';
import type { Prisma, PrismaClient } from '@prisma/client';

export interface EvaluateSetInput {
  userId: string;
  setLogId: string;
  exerciseLibraryId: string;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  isCompleted: boolean;
  sessionId: string;
  achievedAt: Date;
}

type TransactionClient = Prisma.TransactionClient;

/**
 * Detects personal records on set completion per Algorithm Spec §3.
 */
export class PrDetectionService {
  /**
   * Evaluate PRs for a completed working set inside an open transaction.
   *
   * @param tx - Prisma transaction client.
   * @param input - Completed set context.
   * @returns Newly achieved personal records (empty if none).
   */
  async evaluateCompletedSet(
    tx: TransactionClient,
    input: EvaluateSetInput,
  ): Promise<PersonalRecordSummary[]> {
    if (!input.isCompleted || input.isWarmup) {
      return [];
    }

    const weight = input.weightKg;
    const reps = input.reps;
    if (weight <= 0 || reps <= 0) {
      return [];
    }

    const exercise = await tx.exerciseLibrary.findUnique({
      where: { id: input.exerciseLibraryId },
    });
    if (!exercise) {
      return [];
    }

    const newRecords: PersonalRecordSummary[] = [];

    const weightPr = await this.tryWeightPr(tx, input, weight, reps);
    if (weightPr) {
      newRecords.push(weightPr);
    }

    const volume = computeSetVolume(weight, reps);
    if (volume !== null) {
      const volumePr = await this.tryVolumePr(tx, input, roundPrValue(volume));
      if (volumePr) {
        newRecords.push(volumePr);
      }
    }

    const e1rmPr = await this.tryE1rmPr(tx, input);
    if (e1rmPr) {
      newRecords.push(e1rmPr);
    }

    return newRecords;
  }

  /**
   * List recent personal records for a user.
   *
   * @param prisma - Database client.
   * @param userId - Owner user id.
   * @param limit - Max rows (default 5).
   */
  async listRecent(
    prisma: PrismaClient,
    userId: string,
    limit = 5,
  ): Promise<PersonalRecordSummary[]> {
    const records = await prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
      take: limit,
      include: { exerciseLibrary: true },
    });

    return records.map((record) => this.toSummary(record));
  }

  private async tryWeightPr(
    tx: TransactionClient,
    input: EvaluateSetInput,
    weight: number,
    reps: number,
  ): Promise<PersonalRecordSummary | null> {
    const existing = await tx.personalRecord.findFirst({
      where: {
        userId: input.userId,
        exerciseLibraryId: input.exerciseLibraryId,
        prType: 'weight_pr',
        reps,
      },
    });

    const roundedWeight = roundPrValue(weight);
    if (existing && Number(existing.value) >= roundedWeight) {
      return null;
    }

    const record = existing
      ? await tx.personalRecord.update({
          where: { id: existing.id },
          data: {
            value: roundedWeight,
            setLogId: input.setLogId,
            achievedAt: input.achievedAt,
          },
          include: { exerciseLibrary: true },
        })
      : await tx.personalRecord.create({
          data: {
            userId: input.userId,
            exerciseLibraryId: input.exerciseLibraryId,
            prType: 'weight_pr',
            reps,
            value: roundedWeight,
            setLogId: input.setLogId,
            achievedAt: input.achievedAt,
          },
          include: { exerciseLibrary: true },
        });

    return this.toSummary(record);
  }

  private async tryVolumePr(
    tx: TransactionClient,
    input: EvaluateSetInput,
    volume: number,
  ): Promise<PersonalRecordSummary | null> {
    const existing = await tx.personalRecord.findFirst({
      where: {
        userId: input.userId,
        exerciseLibraryId: input.exerciseLibraryId,
        prType: 'volume_pr',
      },
    });

    if (existing && Number(existing.value) >= volume) {
      return null;
    }

    const record = existing
      ? await tx.personalRecord.update({
          where: { id: existing.id },
          data: {
            value: volume,
            setLogId: input.setLogId,
            achievedAt: input.achievedAt,
            reps: null,
          },
          include: { exerciseLibrary: true },
        })
      : await tx.personalRecord.create({
          data: {
            userId: input.userId,
            exerciseLibraryId: input.exerciseLibraryId,
            prType: 'volume_pr',
            reps: null,
            value: volume,
            setLogId: input.setLogId,
            achievedAt: input.achievedAt,
          },
          include: { exerciseLibrary: true },
        });

    return this.toSummary(record);
  }

  private async tryE1rmPr(
    tx: TransactionClient,
    input: EvaluateSetInput,
  ): Promise<PersonalRecordSummary | null> {
    const sessionSets = await tx.setLog.findMany({
      where: {
        isCompleted: true,
        isWarmup: false,
        exerciseExecution: {
          workoutSessionId: input.sessionId,
          exerciseLibraryId: input.exerciseLibraryId,
        },
      },
    });

    let sessionE1rm = 0;
    let bestSetId = input.setLogId;

    for (const set of sessionSets) {
      const weight = set.weightKg !== null ? Number(set.weightKg) : 0;
      const reps = set.reps ?? 0;
      const e1rm = computeE1rm(weight, reps);
      if (e1rm !== null && e1rm > sessionE1rm) {
        sessionE1rm = e1rm;
        bestSetId = set.id;
      }
    }

    if (sessionE1rm <= 0) {
      return null;
    }

    const roundedE1rm = roundPrValue(sessionE1rm);
    const existing = await tx.personalRecord.findFirst({
      where: {
        userId: input.userId,
        exerciseLibraryId: input.exerciseLibraryId,
        prType: 'e1rm_pr',
      },
    });

    if (existing && Number(existing.value) >= roundedE1rm) {
      return null;
    }

    const record = existing
      ? await tx.personalRecord.update({
          where: { id: existing.id },
          data: {
            value: roundedE1rm,
            setLogId: bestSetId,
            achievedAt: input.achievedAt,
            reps: null,
          },
          include: { exerciseLibrary: true },
        })
      : await tx.personalRecord.create({
          data: {
            userId: input.userId,
            exerciseLibraryId: input.exerciseLibraryId,
            prType: 'e1rm_pr',
            reps: null,
            value: roundedE1rm,
            setLogId: bestSetId,
            achievedAt: input.achievedAt,
          },
          include: { exerciseLibrary: true },
        });

    return this.toSummary(record);
  }

  private toSummary(record: {
    id: string;
    exerciseLibraryId: string;
    prType: PrType;
    reps: number | null;
    value: Prisma.Decimal;
    achievedAt: Date;
    exerciseLibrary: { names: unknown; slug: string };
  }): PersonalRecordSummary {
    const names = record.exerciseLibrary.names as { en?: string };
    return {
      id: record.id,
      exerciseLibraryId: record.exerciseLibraryId,
      exerciseName: names.en ?? record.exerciseLibrary.slug,
      prType: record.prType,
      reps: record.reps,
      value: Number(record.value),
      achievedAt: record.achievedAt.toISOString(),
    };
  }
}
