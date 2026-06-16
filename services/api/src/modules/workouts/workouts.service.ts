import type {
  AddWorkoutExerciseInput,
  AddWorkoutSetInput,
  NextWorkoutPreview,
  PrescriptionSnapshot,
  StartWorkoutSessionInput,
  SubstituteExerciseInput,
  UpdateWorkoutSessionNotesInput,
  UpsertSetLogInput,
  UpsertSetResponse,
  WorkoutSessionDetail,
} from '@onemore/shared';
import { aggregateMuscleGroups, normalizeMuscleTags, resolveDayDifficulty } from '@onemore/shared';
import { randomUUID } from 'node:crypto';

import type { Prisma, PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';
import type { MaxValuesService, PendingApprovalResult } from '../max-values/max-values.service.js';
import type { PrDetectionService } from '../progress/pr-detection.service.js';

interface PreviousSetValues {
  weightKg: number | null;
  reps: number | null;
}

interface PreviousExecutionSummary {
  setsCount: number;
  reps: number | null;
  weightKg: number | null;
  completedAt: string | null;
}

/**
 * Workout session lifecycle: start, set logging, completion, and program rotation.
 */
export class WorkoutsService {
  /**
   * @param prisma - Database client.
   * @param prDetection - Personal record evaluator on set completion.
   * @param maxValuesService - Max values evaluator for 1RM proposals.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly prDetection: PrDetectionService,
    private readonly maxValuesService: MaxValuesService,
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
        days: [],
      };
    }

    const workoutDays = assignment.programVersion.workoutDays;
    const dayIds = workoutDays.map((workoutDay) => workoutDay.id);
    const allExercises =
      dayIds.length === 0
        ? []
        : await this.prisma.programExercise.findMany({
            where: { workoutDayId: { in: dayIds } },
            orderBy: [{ workoutDayId: 'asc' }, { sortOrder: 'asc' }],
            include: { exerciseLibrary: true },
          });

    const exercisesByDay = new Map<string, typeof allExercises>();
    for (const exercise of allExercises) {
      const bucket = exercisesByDay.get(exercise.workoutDayId) ?? [];
      bucket.push(exercise);
      exercisesByDay.set(exercise.workoutDayId, bucket);
    }

    const days = workoutDays.map((workoutDay) => {
      const dayExercises = exercisesByDay.get(workoutDay.id) ?? [];
      const exercises = dayExercises.map((item) => this.mapProgramExercise(item));
      return {
        workoutDayId: workoutDay.id,
        label: workoutDay.label,
        difficultyLevel: resolveDayDifficulty(
          dayExercises.map((item) => ({
            targetSets: item.targetSets,
            targetReps: item.targetReps,
            restSeconds: item.restSeconds,
          })),
          workoutDay.difficultyLevel,
        ),
        exerciseCount: dayExercises.length,
        muscleGroups: aggregateMuscleGroups(
          dayExercises.map((item) => ({
            primaryMuscles: normalizeMuscleTags(item.exerciseLibrary.primaryMuscles as string[]),
          })),
        ),
        exercises,
      };
    });

    const suggestedDay = this.resolveWorkoutDay(assignment);
    const suggested = days.find((day) => day.workoutDayId === suggestedDay?.id) ?? days[0] ?? null;

    return {
      hasActiveAssignment: true,
      programAssignmentId: assignment.id,
      workoutDayId: suggested?.workoutDayId ?? null,
      workoutDayLabel: suggested?.label ?? null,
      exerciseCount: suggested?.exerciseCount ?? 0,
      programName: assignment.programVersion.program.name,
      exercises: suggested?.exercises ?? [],
      days,
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

    const exerciseLibraryIds = session.exerciseExecutions.map(
      (execution) => execution.exerciseLibraryId,
    );
    const [previousByExercise, previousExecutions] = await Promise.all([
      this.loadPreviousSetValues(userId, exerciseLibraryIds),
      this.loadPreviousExecutions(userId, exerciseLibraryIds),
    ]);

    return this.toSessionDetail(session, previousByExercise, previousExecutions);
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
    const evaluationResult: { pending: PendingApprovalResult | null } = { pending: null };

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
          rpe: input.rpe,
          rir: input.rir,
          isWarmup: input.isWarmup,
          isCompleted: input.isCompleted,
          isSkipped: input.isSkipped,
          isFailed: input.isFailed,
          clientTimestamp: new Date(input.clientTimestamp),
        },
        update: {
          weightKg: input.weightKg,
          reps: input.reps,
          rpe: input.rpe,
          rir: input.rir,
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

        evaluationResult.pending = await this.maxValuesService.evaluateSet(tx, {
          userId,
          exerciseLibraryId: execution.exerciseLibraryId,
          weightKg: input.weightKg ?? 0,
          reps: input.reps ?? 0,
          rpe: input.rpe,
          rir: input.rir,
          isWarmup: input.isWarmup,
          achievedAt: new Date(input.clientTimestamp),
        });
      }
    });

    const updatedSession = await this.getSession(userId, sessionId);

    let pendingMaxProposal: UpsertSetResponse['pendingMaxProposal'] = null;
    const rawPending = evaluationResult.pending;
    if (rawPending) {
      const matchedExercise = updatedSession.exercises.find(
        (item) => item.exerciseLibraryId === rawPending.exerciseId,
      );
      const names = matchedExercise?.exercise.names;
      pendingMaxProposal = {
        logId: rawPending.logId,
        exerciseId: rawPending.exerciseId,
        exerciseName: names?.en ?? '',
        weight: rawPending.weight,
        reps: rawPending.reps,
        calculated1RM: rawPending.calculated1RM,
      };
    }

    return { session: updatedSession, personalRecords, pendingMaxProposal };
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

      await this.createInitialSets(tx, execution.id, prescription, previousSet, true);
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

  /**
   * Skip an entire exercise execution and its remaining sets.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   * @param executionId - Exercise execution id.
   */
  async skipExercise(
    userId: string,
    sessionId: string,
    executionId: string,
  ): Promise<WorkoutSessionDetail> {
    await this.requireInProgressSession(userId, sessionId);
    await this.requireExecution(sessionId, executionId);

    const updatedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.exerciseExecution.update({
        where: { id: executionId },
        data: { status: 'skipped' },
      });
      await tx.setLog.updateMany({
        where: {
          exerciseExecutionId: executionId,
          isCompleted: false,
          isSkipped: false,
        },
        data: { isSkipped: true },
      });
      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { clientUpdatedAt: updatedAt },
      });
    });

    return this.getSession(userId, sessionId);
  }

  /**
   * Replace a programmed exercise with an alternate for this session only.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   * @param executionId - Exercise execution being replaced.
   * @param input - Substitute exercise library id.
   */
  async substituteExercise(
    userId: string,
    sessionId: string,
    executionId: string,
    input: SubstituteExerciseInput,
  ): Promise<WorkoutSessionDetail> {
    await this.requireInProgressSession(userId, sessionId);
    const execution = await this.requireExecution(sessionId, executionId);

    if (execution.exerciseLibraryId === input.exerciseLibraryId) {
      throw new HttpError(400, 'Substitute must be a different exercise', 'SUBSTITUTE_SAME');
    }

    const substituteExercise = await this.prisma.exerciseLibrary.findFirst({
      where: {
        id: input.exerciseLibraryId,
        deletedAt: null,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
      },
    });
    if (!substituteExercise) {
      throw new HttpError(404, 'Exercise not found', 'EXERCISE_NOT_FOUND');
    }

    const prescription = execution.prescriptionSnapshot as PrescriptionSnapshot;
    const previous = await this.loadPreviousSetValues(userId, [substituteExercise.id]);
    const previousSet = previous.get(substituteExercise.id) ?? null;
    const updatedAt = new Date();
    const newExecutionId = randomUUID();
    const insertSortOrder = execution.sortOrder + 1;

    await this.prisma.$transaction(async (tx) => {
      await tx.exerciseExecution.update({
        where: { id: executionId },
        data: { status: 'skipped' },
      });
      await tx.setLog.updateMany({
        where: {
          exerciseExecutionId: executionId,
          isCompleted: false,
          isSkipped: false,
        },
        data: { isSkipped: true },
      });

      await tx.exerciseExecution.updateMany({
        where: {
          workoutSessionId: sessionId,
          sortOrder: { gte: insertSortOrder },
        },
        data: { sortOrder: { increment: 1 } },
      });

      await tx.exerciseExecution.create({
        data: {
          id: newExecutionId,
          workoutSessionId: sessionId,
          exerciseLibraryId: substituteExercise.id,
          programExerciseId: execution.programExerciseId,
          substitutedFromExerciseId: execution.exerciseLibraryId,
          sortOrder: insertSortOrder,
          status: 'pending',
          prescriptionSnapshot: prescription,
        },
      });

      await this.createInitialSets(tx, newExecutionId, prescription, previousSet, false);

      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { clientUpdatedAt: updatedAt },
      });
    });

    return this.getSession(userId, sessionId);
  }

  /**
   * Update private session notes for an in-progress workout.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   * @param input - Notes payload.
   */
  async updateSessionNotes(
    userId: string,
    sessionId: string,
    input: UpdateWorkoutSessionNotesInput,
  ): Promise<WorkoutSessionDetail> {
    await this.requireInProgressSession(userId, sessionId);

    const updatedAt = new Date();
    await this.prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        privateNotes: input.privateNotes,
        clientUpdatedAt: updatedAt,
      },
    });

    return this.getSession(userId, sessionId);
  }

  /**
   * Update athlete notes for a single exercise execution.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   * @param executionId - Exercise execution id.
   * @param input - Notes payload.
   */
  async updateExerciseNotes(
    userId: string,
    sessionId: string,
    executionId: string,
    input: { athleteNotes: string | null },
  ): Promise<WorkoutSessionDetail> {
    await this.requireInProgressSession(userId, sessionId);
    await this.requireExecution(sessionId, executionId);

    const updatedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.exerciseExecution.update({
        where: { id: executionId },
        data: { athleteNotes: input.athleteNotes },
      });
      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { clientUpdatedAt: updatedAt },
      });
    });

    return this.getSession(userId, sessionId);
  }

  /**
   * Append an extra set beyond the programmed prescription.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   * @param executionId - Exercise execution id.
   * @param input - Client-generated set log id.
   */
  async addExerciseSet(
    userId: string,
    sessionId: string,
    executionId: string,
    input: AddWorkoutSetInput,
  ): Promise<WorkoutSessionDetail> {
    await this.requireInProgressSession(userId, sessionId);

    const execution = await this.prisma.exerciseExecution.findFirst({
      where: { id: executionId, workoutSessionId: sessionId },
      include: { setLogs: { orderBy: { setNumber: 'asc' } } },
    });

    if (!execution) {
      throw new HttpError(404, 'Exercise execution not found', 'EXECUTION_NOT_FOUND');
    }

    if (execution.status === 'skipped') {
      throw new HttpError(409, 'Exercise is skipped', 'EXECUTION_SKIPPED');
    }

    const maxSetNumber = execution.setLogs.reduce((max, set) => Math.max(max, set.setNumber), 0);
    if (maxSetNumber >= 30) {
      throw new HttpError(400, 'Maximum sets reached', 'MAX_SETS_REACHED');
    }

    const lastSet = execution.setLogs.find((set) => set.setNumber === maxSetNumber) ?? null;
    const updatedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.setLog.create({
        data: {
          id: input.id,
          exerciseExecutionId: executionId,
          setNumber: maxSetNumber + 1,
          weightKg: lastSet?.weightKg ?? null,
          reps: lastSet?.reps ?? null,
          isWarmup: false,
          isCompleted: false,
          isSkipped: false,
          isFailed: false,
          clientTimestamp: updatedAt,
        },
      });

      await tx.exerciseExecution.update({
        where: { id: executionId },
        data: { status: 'in_progress' },
      });

      await tx.workoutSession.update({
        where: { id: sessionId },
        data: { clientUpdatedAt: updatedAt },
      });
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
        await this.createInitialSets(tx, execution.id, prescription, previousSet, false);
      }
    });
  }

  private mapProgramExercise(item: {
    id: string;
    exerciseLibraryId: string;
    sortOrder: number;
    targetSets: number;
    targetReps: number;
    targetWeightKg: { toString(): string } | null;
    restSeconds: number;
    coachNote: string | null;
    exerciseLibrary: { id: string; slug: string; names: unknown; isBodyweight: boolean };
  }) {
    return {
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
        isBodyweight: item.exerciseLibrary.isBodyweight,
      },
    };
  }

  private async createInitialSets(
    tx: Prisma.TransactionClient,
    executionId: string,
    prescription: PrescriptionSnapshot,
    previousSet: PreviousSetValues | null,
    prefillFromPrescription: boolean,
  ): Promise<void> {
    const weightKg = prefillFromPrescription
      ? (previousSet?.weightKg ?? prescription.targetWeightKg ?? null)
      : (previousSet?.weightKg ?? null);
    const reps = prefillFromPrescription
      ? (previousSet?.reps ?? prescription.targetReps)
      : (previousSet?.reps ?? null);

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

  private async requireExecution(sessionId: string, executionId: string) {
    const execution = await this.prisma.exerciseExecution.findFirst({
      where: { id: executionId, workoutSessionId: sessionId },
    });

    if (!execution) {
      throw new HttpError(404, 'Exercise execution not found', 'EXECUTION_NOT_FOUND');
    }

    if (execution.status === 'skipped' || execution.status === 'completed') {
      throw new HttpError(409, 'Exercise is already finished', 'EXECUTION_FINISHED');
    }

    return execution;
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

  private async loadPreviousExecutions(
    userId: string,
    exerciseLibraryIds: string[],
  ): Promise<Map<string, PreviousExecutionSummary>> {
    const uniqueIds = [...new Set(exerciseLibraryIds)];
    const result = new Map<string, PreviousExecutionSummary>();

    await Promise.all(
      uniqueIds.map(async (exerciseLibraryId) => {
        const lastExecution = await this.prisma.exerciseExecution.findFirst({
          where: {
            exerciseLibraryId,
            workoutSession: {
              userId,
              status: 'completed',
            },
          },
          orderBy: {
            workoutSession: { completedAt: 'desc' },
          },
          include: {
            workoutSession: { select: { completedAt: true } },
            setLogs: {
              where: { isCompleted: true, isWarmup: false },
              orderBy: { setNumber: 'desc' },
            },
          },
        });

        if (!lastExecution || lastExecution.setLogs.length === 0) {
          return;
        }

        const lastSet = lastExecution.setLogs[0];
        if (!lastSet) {
          return;
        }

        result.set(exerciseLibraryId, {
          setsCount: lastExecution.setLogs.length,
          reps: lastSet.reps,
          weightKg: lastSet.weightKg ? Number(lastSet.weightKg) : null,
          completedAt: lastExecution.workoutSession.completedAt?.toISOString() ?? null,
        });
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
      privateNotes: string | null;
      workoutDay: { label: string; difficultyLevel: number } | null;
      exerciseExecutions: Array<{
        id: string;
        exerciseLibraryId: string;
        substitutedFromExerciseId: string | null;
        sortOrder: number;
        status: string;
        athleteNotes: string | null;
        prescriptionSnapshot: unknown;
        exerciseLibrary: {
          id: string;
          slug: string;
          names: unknown;
          isBodyweight: boolean;
        };
        setLogs: Array<{
          id: string;
          setNumber: number;
          weightKg: { toString(): string } | null;
          reps: number | null;
          rpe: { toString(): string } | null;
          rir: number | null;
          isWarmup: boolean;
          isCompleted: boolean;
          isSkipped: boolean;
          isFailed: boolean;
          clientTimestamp: Date;
        }>;
      }>;
    },
    previousByExercise: Map<string, PreviousSetValues>,
    previousExecutions: Map<string, PreviousExecutionSummary> = new Map(),
  ): WorkoutSessionDetail {
    return {
      id: session.id,
      status: session.status as WorkoutSessionDetail['status'],
      sessionType: session.sessionType as WorkoutSessionDetail['sessionType'],
      programAssignmentId: session.programAssignmentId,
      workoutDayId: session.workoutDayId,
      workoutDayLabel: session.workoutDay?.label ?? null,
      workoutDayDifficultyLevel: session.workoutDay
        ? resolveDayDifficulty([], session.workoutDay.difficultyLevel)
        : null,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      durationSeconds: session.durationSeconds,
      privateNotes: session.privateNotes,
      exercises: session.exerciseExecutions.map((execution) => {
        const prescription = execution.prescriptionSnapshot as PrescriptionSnapshot;
        const names = execution.exerciseLibrary.names as { en: string; it?: string };
        const previousSet = previousByExercise.get(execution.exerciseLibraryId) ?? null;
        const previousExecution = previousExecutions.get(execution.exerciseLibraryId) ?? null;

        return {
          id: execution.id,
          exerciseLibraryId: execution.exerciseLibraryId,
          substitutedFromExerciseId: execution.substitutedFromExerciseId,
          sortOrder: execution.sortOrder,
          status: execution.status as WorkoutSessionDetail['exercises'][number]['status'],
          athleteNotes: execution.athleteNotes,
          prescription,
          exercise: {
            id: execution.exerciseLibrary.id,
            slug: execution.exerciseLibrary.slug,
            names,
            isBodyweight: execution.exerciseLibrary.isBodyweight,
          },
          sets: execution.setLogs.map((set) => ({
            id: set.id,
            setNumber: set.setNumber,
            weightKg: set.weightKg ? Number(set.weightKg) : null,
            reps: set.reps,
            rpe: set.rpe ? Number(set.rpe) : null,
            rir: set.rir,
            isWarmup: set.isWarmup,
            isCompleted: set.isCompleted,
            isSkipped: set.isSkipped,
            isFailed: set.isFailed,
            clientTimestamp: set.clientTimestamp.toISOString(),
          })),
          previousSet,
          previousExecution,
        };
      }),
    };
  }
}
