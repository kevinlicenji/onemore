import type {
  AddWorkoutExerciseInput,
  NextWorkoutPreview,
  PrescriptionSnapshot,
  StartWorkoutSessionInput,
  UpsertSetLogInput,
  UpsertSetResponse,
  WorkoutSessionDetail,
} from '@onemore/shared';
import { randomUUID } from 'node:crypto';

import type { Prisma, PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';
import type { PrDetectionService } from '../progress/pr-detection.service.js';

interface PreviousSetValues {
  weightKg: number | null;
  reps: number | null;
}

/**
 * Workout session lifecycle: start, set logging, completion, and program rotation.
 */
export class WorkoutsService {
  /**
   * @param prisma - Database client.
   * @param prDetection - Personal record evaluator on set completion.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly prDetection: PrDetectionService,
  ) {}

  /**
   * Preview the next programmed workout day for the user's active assignment.
   *
   * @param userId - Authenticated user id.
   */
  async getNextWorkoutPreview(userId: string): Promise<NextWorkoutPreview> {
    const assignment = await this.findActiveAssignment(userId);
    if (!assignment) {
      return {
        hasActiveAssignment: false,
        programAssignmentId: null,
        workoutDayId: null,
        workoutDayLabel: null,
        exerciseCount: 0,
        programName: null,
        exercises: [],
      };
    }

    const day = this.resolveWorkoutDay(assignment);
    if (!day) {
      return {
        hasActiveAssignment: true,
        programAssignmentId: assignment.id,
        workoutDayId: null,
        workoutDayLabel: null,
        exerciseCount: 0,
        programName: assignment.programVersion.program.name,
        exercises: [],
      };
    }

    const programExercises = await this.prisma.programExercise.findMany({
      where: { workoutDayId: day.id },
      orderBy: { sortOrder: 'asc' },
      include: { exerciseLibrary: true },
    });

    return {
      hasActiveAssignment: true,
      programAssignmentId: assignment.id,
      workoutDayId: day.id,
      workoutDayLabel: day.label,
      exerciseCount: programExercises.length,
      programName: assignment.programVersion.program.name,
      exercises: programExercises.map((item) => ({
        programExerciseId: item.id,
        exerciseLibraryId: item.exerciseLibraryId,
        sortOrder: item.sortOrder,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        targetWeightKg: item.targetWeightKg ? Number(item.targetWeightKg) : null,
        restSeconds: item.restSeconds,
        coachNote: item.coachNote,
        exercise: {
          id: item.exerciseLibrary.id,
          slug: item.exerciseLibrary.slug,
          names: item.exerciseLibrary.names as { en: string; it?: string },
        },
      })),
    };
  }

  /**
   * Return the user's in-progress session, if any.
   *
   * @param userId - Authenticated user id.
   */
  async getActiveSession(userId: string): Promise<WorkoutSessionDetail | null> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { userId, status: 'in_progress' },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      return null;
    }

    return this.getSession(userId, session.id);
  }

  /**
   * Start a new workout session from a program day or as a free session.
   *
   * @param userId - Authenticated user id.
   * @param input - Client-generated session id and type.
   */
  async startSession(
    userId: string,
    input: StartWorkoutSessionInput,
  ): Promise<WorkoutSessionDetail> {
    const existing = await this.prisma.workoutSession.findFirst({
      where: { userId, status: 'in_progress' },
    });
    if (existing) {
      throw new HttpError(409, 'An active workout session already exists', 'SESSION_IN_PROGRESS');
    }

    const duplicate = await this.prisma.workoutSession.findUnique({ where: { id: input.id } });
    if (duplicate) {
      throw new HttpError(409, 'Session id already exists', 'SESSION_ID_EXISTS');
    }

    const now = new Date();

    if (input.sessionType === 'programmed') {
      await this.startProgrammedSession(userId, input, now);
    } else {
      await this.prisma.workoutSession.create({
        data: {
          id: input.id,
          userId,
          status: 'in_progress',
          sessionType: 'free',
          startedAt: now,
          clientUpdatedAt: now,
        },
      });
    }

    return this.getSession(userId, input.id);
  }

  /**
   * Load a workout session with exercises and set logs.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   */
  async getSession(userId: string, sessionId: string): Promise<WorkoutSessionDetail> {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        workoutDay: true,
        exerciseExecutions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exerciseLibrary: true,
            setLogs: { orderBy: { setNumber: 'asc' } },
          },
        },
      },
    });

    if (!session) {
      throw new HttpError(404, 'Workout session not found', 'SESSION_NOT_FOUND');
    }

    const previousByExercise = await this.loadPreviousSetValues(
      userId,
      session.exerciseExecutions.map((execution) => execution.exerciseLibraryId),
    );

    return this.toSessionDetail(session, previousByExercise);
  }

  /**
   * Upsert a set log row for an in-progress session.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   * @param input - Set payload with client timestamp.
   */
  async upsertSet(
    userId: string,
    sessionId: string,
    input: UpsertSetLogInput,
  ): Promise<UpsertSetResponse> {
    const session = await this.requireInProgressSession(userId, sessionId);

    const execution = session.exerciseExecutions.find(
      (item) => item.id === input.exerciseExecutionId,
    );
    if (!execution) {
      throw new HttpError(404, 'Exercise execution not found', 'EXECUTION_NOT_FOUND');
    }

    let personalRecords: UpsertSetResponse['personalRecords'] = [];

    await this.prisma.$transaction(async (tx) => {
      await tx.setLog.upsert({
        where: {
          exerciseExecutionId_setNumber: {
            exerciseExecutionId: input.exerciseExecutionId,
            setNumber: input.setNumber,
          },
        },
        create: {
          id: input.id,
          exerciseExecutionId: input.exerciseExecutionId,
          setNumber: input.setNumber,
          weightKg: input.weightKg,
          reps: input.reps,
          isWarmup: input.isWarmup,
          isCompleted: input.isCompleted,
          isSkipped: input.isSkipped,
          isFailed: input.isFailed,
          clientTimestamp: new Date(input.clientTimestamp),
        },
        update: {
          weightKg: input.weightKg,
          reps: input.reps,
          isWarmup: input.isWarmup,
          isCompleted: input.isCompleted,
          isSkipped: input.isSkipped,
          isFailed: input.isFailed,
          clientTimestamp: new Date(input.clientTimestamp),
        },
      });

      const sets = await tx.setLog.findMany({
        where: { exerciseExecutionId: input.exerciseExecutionId },
      });
      const allSetsResolved = sets.every((set) => set.isCompleted || set.isSkipped);
      const anySetStarted = sets.some((set) => set.isCompleted || set.isSkipped);
      const nextStatus = allSetsResolved ? 'completed' : anySetStarted ? 'in_progress' : 'pending';
      await tx.exerciseExecution.update({
        where: { id: input.exerciseExecutionId },
        data: { status: nextStatus },
      });

      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { clientUpdatedAt: new Date(input.clientTimestamp) },
      });

      if (input.isCompleted) {
        personalRecords = await this.prDetection.evaluateCompletedSet(tx, {
          userId,
          setLogId: input.id,
          exerciseLibraryId: execution.exerciseLibraryId,
          weightKg: input.weightKg ?? 0,
          reps: input.reps ?? 0,
          isWarmup: input.isWarmup,
          isCompleted: input.isCompleted,
          sessionId,
          achievedAt: new Date(input.clientTimestamp),
        });
      }
    });

    const updatedSession = await this.getSession(userId, sessionId);
    return { session: updatedSession, personalRecords };
  }

  /**
   * Add an exercise to a free workout session.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   * @param input - Exercise and prescription defaults.
   */
  async addExercise(
    userId: string,
    sessionId: string,
    input: AddWorkoutExerciseInput,
  ): Promise<WorkoutSessionDetail> {
    const session = await this.requireInProgressSession(userId, sessionId);
    if (session.sessionType !== 'free') {
      throw new HttpError(400, 'Can only add exercises to free workouts', 'SESSION_NOT_FREE');
    }

    const exercise = await this.prisma.exerciseLibrary.findFirst({
      where: {
        id: input.exerciseLibraryId,
        deletedAt: null,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
      },
    });
    if (!exercise) {
      throw new HttpError(404, 'Exercise not found', 'EXERCISE_NOT_FOUND');
    }

    const sortOrder = session.exerciseExecutions.length;
    const prescription: PrescriptionSnapshot = {
      targetSets: input.targetSets,
      targetReps: input.targetReps,
      targetWeightKg: null,
      restSeconds: input.restSeconds,
      coachNote: null,
    };

    const previous = await this.loadPreviousSetValues(userId, [exercise.id]);
    const previousSet = previous.get(exercise.id) ?? null;

    await this.prisma.$transaction(async (tx) => {
      const execution = await tx.exerciseExecution.create({
        data: {
          id: randomUUID(),
          workoutSessionId: sessionId,
          exerciseLibraryId: exercise.id,
          sortOrder,
          status: 'pending',
          prescriptionSnapshot: prescription,
        },
      });

      await this.createInitialSets(tx, execution.id, prescription, previousSet);
      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { clientUpdatedAt: new Date() },
      });
    });

    return this.getSession(userId, sessionId);
  }

  /**
   * Mark a workout session as completed and advance program rotation.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   */
  async completeSession(userId: string, sessionId: string): Promise<WorkoutSessionDetail> {
    const session = await this.requireInProgressSession(userId, sessionId);
    const completedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.workoutSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          completedAt,
          durationSeconds,
          clientUpdatedAt: completedAt,
        },
      });

      if (session.programAssignmentId && session.workoutDayId) {
        await this.advanceProgramRotation(tx, session.programAssignmentId, session.workoutDayId);
      }
    });

    return this.getSession(userId, sessionId);
  }

  /**
   * Abandon an in-progress workout session.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   */
  async abandonSession(userId: string, sessionId: string): Promise<WorkoutSessionDetail> {
    await this.requireInProgressSession(userId, sessionId);

    const abandonedAt = new Date();
    await this.prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'abandoned',
        completedAt: abandonedAt,
        clientUpdatedAt: abandonedAt,
      },
    });

    return this.getSession(userId, sessionId);
  }

  private async startProgrammedSession(
    userId: string,
    input: StartWorkoutSessionInput,
    startedAt: Date,
  ): Promise<void> {
    const assignment = input.programAssignmentId
      ? await this.prisma.programAssignment.findFirst({
          where: {
            id: input.programAssignmentId,
            clientUserId: userId,
            status: 'active',
          },
          include: {
            nextWorkoutDay: true,
            programVersion: {
              include: {
                program: true,
                workoutDays: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        })
      : await this.findActiveAssignment(userId);

    if (!assignment) {
      throw new HttpError(404, 'No active program assignment found', 'ASSIGNMENT_NOT_FOUND');
    }

    const workoutDay = input.workoutDayId
      ? assignment.programVersion.workoutDays.find((day) => day.id === input.workoutDayId)
      : this.resolveWorkoutDay(assignment);

    if (!workoutDay) {
      throw new HttpError(404, 'Workout day not found', 'WORKOUT_DAY_NOT_FOUND');
    }

    const programExercises = await this.prisma.programExercise.findMany({
      where: { workoutDayId: workoutDay.id },
      orderBy: { sortOrder: 'asc' },
      include: { exerciseLibrary: true },
    });

    if (programExercises.length === 0) {
      throw new HttpError(400, 'Workout day has no exercises', 'WORKOUT_DAY_EMPTY');
    }

    const previousByExercise = await this.loadPreviousSetValues(
      userId,
      programExercises.map((item) => item.exerciseLibraryId),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.workoutSession.create({
        data: {
          id: input.id,
          userId,
          programAssignmentId: assignment.id,
          workoutDayId: workoutDay.id,
          status: 'in_progress',
          sessionType: 'programmed',
          startedAt,
          clientUpdatedAt: startedAt,
        },
      });

      for (const [index, programExercise] of programExercises.entries()) {
        const prescription: PrescriptionSnapshot = {
          targetSets: programExercise.targetSets,
          targetReps: programExercise.targetReps,
          targetWeightKg: programExercise.targetWeightKg
            ? Number(programExercise.targetWeightKg)
            : null,
          restSeconds: programExercise.restSeconds,
          coachNote: programExercise.coachNote,
        };

        const execution = await tx.exerciseExecution.create({
          data: {
            id: randomUUID(),
            workoutSessionId: input.id,
            exerciseLibraryId: programExercise.exerciseLibraryId,
            programExerciseId: programExercise.id,
            sortOrder: index,
            status: 'pending',
            prescriptionSnapshot: prescription,
          },
        });

        const previousSet = previousByExercise.get(programExercise.exerciseLibraryId) ?? null;
        await this.createInitialSets(tx, execution.id, prescription, previousSet);
      }
    });
  }

  private async createInitialSets(
    tx: Prisma.TransactionClient,
    executionId: string,
    prescription: PrescriptionSnapshot,
    previousSet: PreviousSetValues | null,
  ): Promise<void> {
    const weightKg = previousSet?.weightKg ?? prescription.targetWeightKg ?? null;
    const reps = previousSet?.reps ?? prescription.targetReps;

    for (let setNumber = 1; setNumber <= prescription.targetSets; setNumber += 1) {
      await tx.setLog.create({
        data: {
          id: randomUUID(),
          exerciseExecutionId: executionId,
          setNumber,
          weightKg,
          reps,
          isWarmup: false,
          isCompleted: false,
          isSkipped: false,
          isFailed: false,
          clientTimestamp: new Date(),
        },
      });
    }
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

  private async findActiveAssignment(userId: string) {
    return this.prisma.programAssignment.findFirst({
      where: { clientUserId: userId, status: 'active' },
      orderBy: { startedAt: 'desc' },
      include: {
        programVersion: {
          include: {
            program: true,
            workoutDays: { orderBy: { sortOrder: 'asc' } },
          },
        },
        nextWorkoutDay: true,
      },
    });
  }

  /**
   * Next programmed day from assignment rotation (P6-07).
   * Rotation advances in {@link advanceProgramRotation} when a programmed session completes.
   */
  private resolveWorkoutDay(
    assignment: NonNullable<Awaited<ReturnType<WorkoutsService['findActiveAssignment']>>>,
  ) {
    if (assignment.nextWorkoutDay) {
      return assignment.nextWorkoutDay;
    }

    return assignment.programVersion.workoutDays[0] ?? null;
  }

  private async requireInProgressSession(userId: string, sessionId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        exerciseExecutions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!session) {
      throw new HttpError(404, 'Workout session not found', 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'in_progress') {
      throw new HttpError(409, 'Workout session is not in progress', 'SESSION_NOT_ACTIVE');
    }

    return session;
  }

  private async loadPreviousSetValues(
    userId: string,
    exerciseLibraryIds: string[],
  ): Promise<Map<string, PreviousSetValues>> {
    const uniqueIds = [...new Set(exerciseLibraryIds)];
    const result = new Map<string, PreviousSetValues>();

    await Promise.all(
      uniqueIds.map(async (exerciseLibraryId) => {
        const lastSet = await this.prisma.setLog.findFirst({
          where: {
            isCompleted: true,
            exerciseExecution: {
              exerciseLibraryId,
              workoutSession: {
                userId,
                status: 'completed',
              },
            },
          },
          orderBy: { clientTimestamp: 'desc' },
        });

        if (lastSet) {
          result.set(exerciseLibraryId, {
            weightKg: lastSet.weightKg ? Number(lastSet.weightKg) : null,
            reps: lastSet.reps,
          });
        }
      }),
    );

    return result;
  }

  private toSessionDetail(
    session: {
      id: string;
      status: string;
      sessionType: string;
      programAssignmentId: string | null;
      workoutDayId: string | null;
      startedAt: Date;
      completedAt: Date | null;
      durationSeconds: number | null;
      workoutDay: { label: string } | null;
      exerciseExecutions: Array<{
        id: string;
        exerciseLibraryId: string;
        sortOrder: number;
        status: string;
        prescriptionSnapshot: unknown;
        exerciseLibrary: {
          id: string;
          slug: string;
          names: unknown;
        };
        setLogs: Array<{
          id: string;
          setNumber: number;
          weightKg: { toString(): string } | null;
          reps: number | null;
          isWarmup: boolean;
          isCompleted: boolean;
          isSkipped: boolean;
          isFailed: boolean;
          clientTimestamp: Date;
        }>;
      }>;
    },
    previousByExercise: Map<string, PreviousSetValues>,
  ): WorkoutSessionDetail {
    return {
      id: session.id,
      status: session.status as WorkoutSessionDetail['status'],
      sessionType: session.sessionType as WorkoutSessionDetail['sessionType'],
      programAssignmentId: session.programAssignmentId,
      workoutDayId: session.workoutDayId,
      workoutDayLabel: session.workoutDay?.label ?? null,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      durationSeconds: session.durationSeconds,
      exercises: session.exerciseExecutions.map((execution) => {
        const prescription = execution.prescriptionSnapshot as PrescriptionSnapshot;
        const names = execution.exerciseLibrary.names as { en: string; it?: string };
        const previousSet = previousByExercise.get(execution.exerciseLibraryId) ?? null;

        return {
          id: execution.id,
          exerciseLibraryId: execution.exerciseLibraryId,
          sortOrder: execution.sortOrder,
          status: execution.status as WorkoutSessionDetail['exercises'][number]['status'],
          prescription,
          exercise: {
            id: execution.exerciseLibrary.id,
            slug: execution.exerciseLibrary.slug,
            names,
          },
          sets: execution.setLogs.map((set) => ({
            id: set.id,
            setNumber: set.setNumber,
            weightKg: set.weightKg ? Number(set.weightKg) : null,
            reps: set.reps,
            isWarmup: set.isWarmup,
            isCompleted: set.isCompleted,
            isSkipped: set.isSkipped,
            isFailed: set.isFailed,
            clientTimestamp: set.clientTimestamp.toISOString(),
          })),
          previousSet,
        };
      }),
    };
  }
}
