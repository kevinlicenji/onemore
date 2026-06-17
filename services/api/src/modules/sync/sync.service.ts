import type {
  SyncBatchRequest,
  SyncBatchResponse,
  SyncDeltaResponse,
  SyncMutation,
} from '@onemore/shared';
import { normalizeMuscleTags } from '@onemore/shared';
import type { Prisma, PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';
import type { MaxValuesService } from '../max-values/max-values.service.js';
import type { PrDetectionService } from '../progress/pr-detection.service.js';
import type { WorkoutsService } from '../workouts/workouts.service.js';
import { shouldAcceptSessionUpdate, shouldAcceptSetLogUpdate } from './sync-merge.js';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Offline sync batch ingestion and delta pull for athlete clients.
 */
export class SyncService {
  /**
   * @param prisma - Database client.
   * @param workoutsService - Workout read helpers for delta responses.
   * @param prDetection - PR evaluation on synced set completions.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly workoutsService: WorkoutsService,
    private readonly prDetection: PrDetectionService,
    private readonly maxValuesService: MaxValuesService,
  ) {}

  /**
   * Apply ordered client mutations with idempotency and last-write-wins merges.
   *
   * @param userId - Authenticated user id.
   * @param idempotencyKey - Unique key for this batch upload.
   * @param request - Batch payload from the client.
   */
  async processBatch(
    userId: string,
    idempotencyKey: string,
    request: SyncBatchRequest,
  ): Promise<SyncBatchResponse> {
    const cached = await this.prisma.syncIdempotency.findUnique({ where: { key: idempotencyKey } });
    if (cached) {
      return cached.responseBody as SyncBatchResponse;
    }

    const acknowledged: string[] = [];
    const conflicts: SyncBatchResponse['conflicts'] = [];
    const completedSessionIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const mutation of request.mutations) {
        const entityId = this.getMutationEntityId(mutation);
        try {
          const applied = await this.applyMutation(tx, userId, mutation);
          if (applied) {
            acknowledged.push(entityId);
            if (mutation.type === 'workout_session' && mutation.payload.status === 'completed') {
              completedSessionIds.push(mutation.payload.id);
            }
          } else {
            conflicts.push({
              entityId,
              type: mutation.type,
              reason: 'STALE_CLIENT_TIMESTAMP',
            });
          }
        } catch (error) {
          if (error instanceof HttpError) {
            conflicts.push({
              entityId,
              type: mutation.type,
              reason: error.code,
            });
            continue;
          }
          throw error;
        }
      }

      for (const sessionId of completedSessionIds) {
        const session = await tx.workoutSession.findFirst({
          where: { id: sessionId, userId, status: 'completed' },
        });
        if (session?.programAssignmentId && session.workoutDayId) {
          await this.advanceProgramRotation(tx, session.programAssignmentId, session.workoutDayId);
        }
      }
    });

    const response: SyncBatchResponse = {
      serverTime: new Date().toISOString(),
      acknowledged,
      conflicts,
    };

    await this.prisma.syncIdempotency.create({
      data: {
        key: idempotencyKey,
        responseBody: response,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      },
    });

    return response;
  }

  /**
   * Pull server-side changes since a client watermark.
   *
   * @param userId - Authenticated user id.
   * @param since - Optional ISO timestamp watermark.
   */
  async getDelta(userId: string, since?: string): Promise<SyncDeltaResponse> {
    const sinceDate = since ? new Date(since) : new Date(0);

    const exercises = await this.prisma.exerciseLibrary.findMany({
      where: {
        deletedAt: null,
        updatedAt: { gt: sinceDate },
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
      },
      orderBy: { updatedAt: 'asc' },
      take: 200,
    });

    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        updatedAt: { gt: sinceDate },
      },
      orderBy: { updatedAt: 'asc' },
      take: 50,
    });

    const sessionDetails = await Promise.all(
      sessions.map((session) => this.workoutsService.getSession(userId, session.id)),
    );

    const nextWorkout = await this.workoutsService.getNextWorkoutPreview(userId);

    return {
      serverTime: new Date().toISOString(),
      exercises: exercises.map((exercise) => ({
        id: exercise.id,
        slug: exercise.slug,
        names: exercise.names as { en: string; it?: string },
        category: exercise.category,
        primaryMuscles: normalizeMuscleTags(exercise.primaryMuscles as string[]),
        secondaryMuscles: exercise.secondaryMuscles as string[],
        equipment: exercise.equipment,
        isBodyweight: exercise.isBodyweight,
        isCustom: exercise.ownerUserId === userId,
      })),
      nextWorkout,
      sessions: sessionDetails,
    };
  }

  private getMutationEntityId(mutation: SyncMutation): string {
    return mutation.payload.id;
  }

  private async applyMutation(
    tx: Prisma.TransactionClient,
    userId: string,
    mutation: SyncMutation,
  ): Promise<boolean> {
    switch (mutation.type) {
      case 'workout_session':
        return this.applySessionMutation(tx, userId, mutation.payload);
      case 'exercise_execution':
        return this.applyExecutionMutation(tx, userId, mutation.payload);
      case 'set_log':
        return this.applySetLogMutation(tx, userId, mutation.payload);
      default: {
        const exhaustive: never = mutation;
        throw new HttpError(400, `Unknown mutation ${String(exhaustive)}`, 'INVALID_MUTATION');
      }
    }
  }

  private async applySessionMutation(
    tx: Prisma.TransactionClient,
    userId: string,
    payload: Extract<SyncMutation, { type: 'workout_session' }>['payload'],
  ): Promise<boolean> {
    const incomingUpdatedAt = new Date(payload.clientUpdatedAt);
    const existing = await tx.workoutSession.findFirst({
      where: { id: payload.id, userId },
    });

    if (existing && !shouldAcceptSessionUpdate(existing.clientUpdatedAt, incomingUpdatedAt)) {
      console.warn(
        `[sync] session conflict — discarding stale update for session ${payload.id}` +
          ` (server: ${existing.clientUpdatedAt.toISOString()}, incoming: ${incomingUpdatedAt.toISOString()})`,
      );
      return false;
    }

    if (existing) {
      await tx.workoutSession.update({
        where: { id: payload.id },
        data: {
          programAssignmentId: payload.programAssignmentId ?? null,
          workoutDayId: payload.workoutDayId ?? null,
          status: payload.status,
          sessionType: payload.sessionType,
          startedAt: new Date(payload.startedAt),
          completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
          durationSeconds: payload.durationSeconds ?? null,
          clientUpdatedAt: incomingUpdatedAt,
        },
      });
      return true;
    }

    const inProgress = await tx.workoutSession.findFirst({
      where: { userId, status: 'in_progress', id: { not: payload.id } },
    });
    if (inProgress && payload.status === 'in_progress') {
      throw new HttpError(409, 'Active session already exists', 'SESSION_IN_PROGRESS');
    }

    await tx.workoutSession.create({
      data: {
        id: payload.id,
        userId,
        programAssignmentId: payload.programAssignmentId ?? null,
        workoutDayId: payload.workoutDayId ?? null,
        status: payload.status,
        sessionType: payload.sessionType,
        startedAt: new Date(payload.startedAt),
        completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
        durationSeconds: payload.durationSeconds ?? null,
        clientUpdatedAt: incomingUpdatedAt,
      },
    });

    return true;
  }

  private async applyExecutionMutation(
    tx: Prisma.TransactionClient,
    userId: string,
    payload: Extract<SyncMutation, { type: 'exercise_execution' }>['payload'],
  ): Promise<boolean> {
    const session = await tx.workoutSession.findFirst({
      where: { id: payload.workoutSessionId, userId },
    });
    if (!session) {
      throw new HttpError(404, 'Workout session not found', 'SESSION_NOT_FOUND');
    }

    await tx.exerciseExecution.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        workoutSessionId: payload.workoutSessionId,
        exerciseLibraryId: payload.exerciseLibraryId,
        programExerciseId: payload.programExerciseId ?? null,
        sortOrder: payload.sortOrder,
        status: payload.status,
        prescriptionSnapshot: payload.prescriptionSnapshot,
      },
      update: {
        exerciseLibraryId: payload.exerciseLibraryId,
        programExerciseId: payload.programExerciseId ?? null,
        sortOrder: payload.sortOrder,
        status: payload.status,
        prescriptionSnapshot: payload.prescriptionSnapshot,
      },
    });

    return true;
  }

  private async applySetLogMutation(
    tx: Prisma.TransactionClient,
    userId: string,
    payload: Extract<SyncMutation, { type: 'set_log' }>['payload'],
  ): Promise<boolean> {
    const execution = await tx.exerciseExecution.findFirst({
      where: {
        id: payload.exerciseExecutionId,
        workoutSession: { userId },
      },
    });
    if (!execution) {
      throw new HttpError(404, 'Exercise execution not found', 'EXECUTION_NOT_FOUND');
    }

    const existing = await tx.setLog.findUnique({
      where: {
        exerciseExecutionId_setNumber: {
          exerciseExecutionId: payload.exerciseExecutionId,
          setNumber: payload.setNumber,
        },
      },
    });

    const incomingTimestamp = new Date(payload.clientTimestamp);
    if (existing && !shouldAcceptSetLogUpdate(existing.clientTimestamp, incomingTimestamp)) {
      console.warn(
        `[sync] set log conflict — discarding stale update for exercise execution ${payload.exerciseExecutionId}` +
          ` set ${String(payload.setNumber)}` +
          ` (server: ${existing.clientTimestamp.toISOString()}, incoming: ${incomingTimestamp.toISOString()})`,
      );
      return false;
    }

    await tx.setLog.upsert({
      where: {
        exerciseExecutionId_setNumber: {
          exerciseExecutionId: payload.exerciseExecutionId,
          setNumber: payload.setNumber,
        },
      },
      create: {
        id: payload.id,
        exerciseExecutionId: payload.exerciseExecutionId,
        setNumber: payload.setNumber,
        weightKg: payload.weightKg,
        reps: payload.reps,
        rpe: payload.rpe,
        rir: payload.rir,
        isWarmup: payload.isWarmup,
        isCompleted: payload.isCompleted,
        isSkipped: payload.isSkipped,
        isFailed: payload.isFailed,
        clientTimestamp: incomingTimestamp,
      },
      update: {
        weightKg: payload.weightKg,
        reps: payload.reps,
        rpe: payload.rpe,
        rir: payload.rir,
        isWarmup: payload.isWarmup,
        isCompleted: payload.isCompleted,
        isSkipped: payload.isSkipped,
        isFailed: payload.isFailed,
        clientTimestamp: incomingTimestamp,
      },
    });

    const sets = await tx.setLog.findMany({
      where: { exerciseExecutionId: payload.exerciseExecutionId },
    });
    const allSetsResolved = sets.every((set) => set.isCompleted || set.isSkipped);
    const anySetStarted = sets.some((set) => set.isCompleted || set.isSkipped);
    const nextStatus = allSetsResolved ? 'completed' : anySetStarted ? 'in_progress' : 'pending';

    await tx.exerciseExecution.update({
      where: { id: payload.exerciseExecutionId },
      data: { status: nextStatus },
    });

    await tx.workoutSession.update({
      where: { id: execution.workoutSessionId },
      data: { clientUpdatedAt: incomingTimestamp },
    });

    if (payload.isCompleted) {
      await this.prDetection.evaluateCompletedSet(tx, {
        userId,
        setLogId: payload.id,
        exerciseLibraryId: execution.exerciseLibraryId,
        weightKg: payload.weightKg ?? 0,
        reps: payload.reps ?? 0,
        isWarmup: payload.isWarmup,
        isCompleted: payload.isCompleted,
        sessionId: execution.workoutSessionId,
        achievedAt: incomingTimestamp,
      });

      await this.maxValuesService.evaluateSet(tx, {
        userId,
        exerciseLibraryId: execution.exerciseLibraryId,
        weightKg: payload.weightKg ?? 0,
        reps: payload.reps ?? 0,
        rpe: payload.rpe,
        rir: payload.rir,
        isWarmup: payload.isWarmup,
        achievedAt: incomingTimestamp,
      });
    }

    return true;
  }

  private async advanceProgramRotation(
    tx: Prisma.TransactionClient,
    assignmentId: string,
    completedDayId: string,
  ): Promise<void> {
    const assignment = await tx.programAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        programVersion: {
          include: {
            workoutDays: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!assignment) {
      return;
    }

    const days = assignment.programVersion.workoutDays;
    const currentIndex = days.findIndex((day) => day.id === completedDayId);
    const nextDay =
      currentIndex >= 0 && days.length > 0 ? days[(currentIndex + 1) % days.length] : days[0];

    await tx.programAssignment.update({
      where: { id: assignmentId },
      data: {
        lastCompletedWorkoutDayId: completedDayId,
        nextWorkoutDayId: nextDay?.id ?? null,
      },
    });
  }
}
