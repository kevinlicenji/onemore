import type {
  AddWorkoutExerciseInput,
  ExerciseListItem,
  NextWorkoutPreview,
  StartWorkoutSessionInput,
  UpsertSetLogInput,
  UpsertSetResponse,
  WorkoutSessionDetail,
} from '@onemore/shared';
import { EXERCISE_CATALOG_LIMIT } from '@onemore/shared';

import {
  abandonWorkoutSession,
  addWorkoutExercise,
  addWorkoutExerciseSet,
  completeWorkoutSession,
  fetchActiveWorkoutSession,
  fetchNextWorkoutPreview,
  fetchWorkoutSession,
  searchExercises,
  skipWorkoutExercise,
  startWorkoutSession,
  substituteWorkoutExercise,
  updateWorkoutExerciseNotes,
  updateWorkoutSessionNotes,
  upsertWorkoutSet,
} from '@/lib/api-auth';

import { emitDashboardInvalidation } from '@/lib/dashboard/dashboard-events';
import { invalidateDashboardCache } from '@/lib/dashboard/dashboard-cache';
import { sortExercisesByDisplayName } from '@/lib/exercise-display-name';
import { generateClientUuid } from '@/lib/generate-client-uuid';
import { isInvalidAccessTokenError, refreshAccessToken } from '@/lib/refresh-access-token';

import { persistPersonalRecords, upsertCompletedSessionSummary } from './dashboard-store';
import { offlineDb } from './db';
import { purgeInProgressSessions, purgeLocalSession } from './session-cleanup';
import { loadPreviousExecutionsMap, loadPreviousSetsMap } from './resolve-previous-set';
import { enqueueMutation, flushSyncQueue, isBrowserOnline } from './sync-engine';

export interface WorkoutClientAuthOptions {
  onAccessTokenRefreshed?: (accessToken: string) => void;
}

async function syncIfOnline(accessToken: string): Promise<void> {
  if (!isBrowserOnline()) {
    return;
  }
  try {
    await flushSyncQueue(accessToken);
  } catch {
    // Queue remains for retry on next online event.
  }
}

async function buildLocalProgrammedSession(
  input: StartWorkoutSessionInput,
  preview: NextWorkoutPreview,
): Promise<WorkoutSessionDetail> {
  const startedAt = new Date().toISOString();
  const selectedDayId = input.workoutDayId ?? preview.workoutDayId;
  const selectedDay =
    preview.days.find((day) => day.workoutDayId === selectedDayId) ?? preview.days[0] ?? null;
  const dayExercises = selectedDay?.exercises ?? preview.exercises;
  const previousByExercise = await loadPreviousSetsMap(
    dayExercises.map((item) => item.exerciseLibraryId),
    input.id,
  );
  const previousExecutions = await loadPreviousExecutionsMap(
    dayExercises.map((item) => item.exerciseLibraryId),
    input.id,
  );

  return {
    id: input.id,
    status: 'in_progress',
    sessionType: 'programmed',
    programAssignmentId: preview.programAssignmentId,
    workoutDayId: selectedDay?.workoutDayId ?? preview.workoutDayId,
    workoutDayLabel: selectedDay?.label ?? preview.workoutDayLabel,
    workoutDayDifficultyLevel: selectedDay?.difficultyLevel ?? null,
    startedAt,
    completedAt: null,
    durationSeconds: null,
    privateNotes: null,
    exercises: dayExercises.map((item, index) => {
      const executionId = generateClientUuid();
      return {
        id: executionId,
        exerciseLibraryId: item.exerciseLibraryId,
        sortOrder: index,
        status: 'pending' as const,
        athleteNotes: null,
        prescription: {
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          targetWeightKg: item.targetWeightKg,
          restSeconds: item.restSeconds,
          coachNote: item.coachNote,
        },
        exercise: item.exercise,
        previousSet: previousByExercise.get(item.exerciseLibraryId) ?? null,
        previousExecution: previousExecutions.get(item.exerciseLibraryId) ?? null,
        sets: Array.from({ length: item.targetSets }, (_, setIndex) => ({
          id: generateClientUuid(),
          setNumber: setIndex + 1,
          weightKg: null,
          reps: null,
          rpe: null,
          rir: null,
          isWarmup: false,
          isCompleted: false,
          isSkipped: false,
          isFailed: false,
          clientTimestamp: startedAt,
        })),
      };
    }),
  };
}

async function persistSessionLocally(session: WorkoutSessionDetail): Promise<void> {
  await offlineDb.sessions.put(session);

  const clientUpdatedAt = new Date().toISOString();
  await enqueueMutation({
    type: 'workout_session',
    op: 'upsert',
    payload: {
      id: session.id,
      programAssignmentId: session.programAssignmentId,
      workoutDayId: session.workoutDayId,
      status: session.status,
      sessionType: session.sessionType,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      durationSeconds: session.durationSeconds,
      clientUpdatedAt,
    },
  });

  for (const exercise of session.exercises) {
    await enqueueMutation({
      type: 'exercise_execution',
      op: 'upsert',
      payload: {
        id: exercise.id,
        workoutSessionId: session.id,
        exerciseLibraryId: exercise.exerciseLibraryId,
        sortOrder: exercise.sortOrder,
        status: exercise.status,
        prescriptionSnapshot: exercise.prescription,
      },
    });

    for (const set of exercise.sets) {
      await enqueueMutation({
        type: 'set_log',
        op: 'upsert',
        payload: {
          id: set.id,
          exerciseExecutionId: exercise.id,
          setNumber: set.setNumber,
          weightKg: set.weightKg,
          reps: set.reps,
          isWarmup: set.isWarmup,
          isCompleted: set.isCompleted,
          isSkipped: set.isSkipped,
          isFailed: set.isFailed,
          clientTimestamp: set.clientTimestamp,
        },
      });
    }
  }
}

export async function getNextWorkoutPreviewClient(
  accessToken: string,
): Promise<NextWorkoutPreview> {
  if (isBrowserOnline()) {
    const preview = await fetchNextWorkoutPreview(accessToken);
    await offlineDb.nextWorkout.put({ ...preview, id: 'default' });
    return preview;
  }

  const cached = await offlineDb.nextWorkout.get('default');
  if (!cached) {
    throw new Error('Offline catalog not available');
  }
  return {
    hasActiveAssignment: cached.hasActiveAssignment,
    programAssignmentId: cached.programAssignmentId,
    workoutDayId: cached.workoutDayId,
    workoutDayLabel: cached.workoutDayLabel,
    exerciseCount: cached.exerciseCount,
    programName: cached.programName,
    exercises: cached.exercises,
    days: Array.isArray(cached.days) ? cached.days : [],
  };
}

function countCompletedSets(session: WorkoutSessionDetail): number {
  return session.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.isCompleted && !set.isWarmup).length,
    0,
  );
}

function isSessionNotFoundError(error: unknown): boolean {
  return error instanceof Error && /not found/i.test(error.message);
}

export async function getActiveWorkoutSessionClient(
  accessToken: string,
): Promise<WorkoutSessionDetail | null> {
  if (!isBrowserOnline()) {
    return (await offlineDb.sessions.where('status').equals('in_progress').first()) ?? null;
  }

  const remote = await fetchActiveWorkoutSession(accessToken);

  if (!remote) {
    await purgeInProgressSessions();
    return null;
  }

  const locals = await offlineDb.sessions.where('status').equals('in_progress').toArray();
  for (const stale of locals) {
    if (stale.id !== remote.id) {
      await purgeLocalSession(stale.id);
    }
  }

  const local = locals.find((row) => row.id === remote.id);
  const preferred =
    local && countCompletedSets(local) > countCompletedSets(remote) ? local : remote;
  await offlineDb.sessions.put(preferred);
  return preferred;
}

export async function startWorkoutSessionClient(
  accessToken: string,
  input: StartWorkoutSessionInput,
): Promise<WorkoutSessionDetail> {
  if (isBrowserOnline()) {
    const session = await startWorkoutSession(accessToken, input);
    await offlineDb.sessions.put(session);
    await syncIfOnline(accessToken);
    return session;
  }

  if (input.sessionType === 'programmed') {
    const preview = await getNextWorkoutPreviewClient(accessToken);
    const session = await buildLocalProgrammedSession(input, preview);
    await persistSessionLocally(session);
    return session;
  }

  const startedAt = new Date().toISOString();
  const session: WorkoutSessionDetail = {
    id: input.id,
    status: 'in_progress',
    sessionType: 'free',
    programAssignmentId: null,
    workoutDayId: null,
    workoutDayLabel: null,
    workoutDayDifficultyLevel: null,
    startedAt,
    completedAt: null,
    durationSeconds: null,
    privateNotes: null,
    exercises: [],
  };
  await persistSessionLocally(session);
  return session;
}

export async function getWorkoutSessionClient(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const local = await offlineDb.sessions.get(sessionId);
  if (local) {
    return local;
  }

  if (!isBrowserOnline()) {
    throw new Error('Workout session not available offline');
  }

  const remote = await fetchWorkoutSession(accessToken, sessionId);
  await offlineDb.sessions.put(remote);
  return remote;
}

async function applyLocalSetUpdate(
  sessionId: string,
  payload: UpsertSetLogInput,
): Promise<UpsertSetResponse> {
  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }

  const updatedExercises = session.exercises.map((exercise) => {
    if (exercise.id !== payload.exerciseExecutionId) {
      return exercise;
    }

    const sets = exercise.sets.map((set) =>
      set.id === payload.id
        ? {
            ...set,
            weightKg: payload.weightKg ?? set.weightKg,
            reps: payload.reps ?? set.reps,
            isCompleted: payload.isCompleted,
            isSkipped: payload.isSkipped,
            isFailed: payload.isFailed,
            isWarmup: payload.isWarmup,
            clientTimestamp: payload.clientTimestamp,
          }
        : set,
    );

    const allDone = sets.every((set) => set.isCompleted || set.isSkipped);
    const anyStarted = sets.some((set) => set.isCompleted || set.isSkipped);
    const status: (typeof exercise)['status'] = allDone
      ? 'completed'
      : anyStarted
        ? 'in_progress'
        : 'pending';

    return { ...exercise, sets, status };
  });

  const updatedSession: WorkoutSessionDetail = { ...session, exercises: updatedExercises };
  await offlineDb.sessions.put(updatedSession);
  return { session: updatedSession, personalRecords: [] };
}

async function syncSetToServer(
  accessToken: string,
  sessionId: string,
  payload: UpsertSetLogInput,
): Promise<UpsertSetResponse> {
  const result = await upsertWorkoutSet(accessToken, sessionId, payload);
  await offlineDb.sessions.put(result.session);
  await persistPersonalRecords(result.personalRecords);
  await syncIfOnline(accessToken);
  return result;
}

async function syncSetWithAuthRetry(
  accessToken: string,
  sessionId: string,
  payload: UpsertSetLogInput,
  options?: WorkoutClientAuthOptions,
): Promise<UpsertSetResponse> {
  try {
    return await syncSetToServer(accessToken, sessionId, payload);
  } catch (error) {
    if (!isInvalidAccessTokenError(error)) {
      throw error;
    }

    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw error;
    }

    options?.onAccessTokenRefreshed?.(refreshed.accessToken);
    return syncSetToServer(refreshed.accessToken, sessionId, payload);
  }
}

async function ensureSessionInLocalDb(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const cached = await offlineDb.sessions.get(sessionId);
  if (cached) {
    return cached;
  }

  if (!isBrowserOnline()) {
    throw new Error('Session not found locally');
  }

  const remote = await fetchWorkoutSession(accessToken, sessionId);
  await offlineDb.sessions.put(remote);
  return remote;
}

export async function upsertWorkoutSetClient(
  accessToken: string,
  sessionId: string,
  payload: UpsertSetLogInput,
  options?: WorkoutClientAuthOptions,
): Promise<UpsertSetResponse> {
  await ensureSessionInLocalDb(accessToken, sessionId);
  const localResult = await applyLocalSetUpdate(sessionId, payload);

  if (!isBrowserOnline()) {
    await enqueueMutation({
      type: 'set_log',
      op: 'upsert',
      payload,
    });
    return localResult;
  }

  try {
    return await syncSetWithAuthRetry(accessToken, sessionId, payload, options);
  } catch {
    await enqueueMutation({
      type: 'set_log',
      op: 'upsert',
      payload,
    });
    return localResult;
  }
}

export async function addWorkoutExerciseClient(
  accessToken: string,
  sessionId: string,
  payload: AddWorkoutExerciseInput,
): Promise<WorkoutSessionDetail> {
  if (isBrowserOnline()) {
    const session = await addWorkoutExercise(accessToken, sessionId, payload);
    await offlineDb.sessions.put(session);
    await syncIfOnline(accessToken);
    return session;
  }

  const exercise = await offlineDb.exercises.get(payload.exerciseLibraryId);
  if (!exercise) {
    throw new Error('Exercise not found offline');
  }

  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }

  const executionId = generateClientUuid();
  const startedAt = new Date().toISOString();
  const previousByExercise = await loadPreviousSetsMap([exercise.id], sessionId);
  const newExercise = {
    id: executionId,
    exerciseLibraryId: exercise.id,
    sortOrder: session.exercises.length,
    status: 'pending' as const,
    athleteNotes: null,
    prescription: {
      targetSets: payload.targetSets,
      targetReps: payload.targetReps,
      targetWeightKg: null,
      restSeconds: payload.restSeconds,
      coachNote: null,
    },
    exercise: {
      id: exercise.id,
      slug: exercise.slug,
      names: exercise.names,
      isBodyweight: exercise.isBodyweight,
    },
    previousSet: previousByExercise.get(exercise.id) ?? null,
    sets: Array.from({ length: payload.targetSets }, (_, index) => ({
      id: generateClientUuid(),
      setNumber: index + 1,
      weightKg: null,
      reps: payload.targetReps,
      rpe: null,
      rir: null,
      isWarmup: false,
      isCompleted: false,
      isSkipped: false,
      isFailed: false,
      clientTimestamp: startedAt,
    })),
  };

  const updatedSession: WorkoutSessionDetail = {
    ...session,
    exercises: [...session.exercises, newExercise],
  };

  await offlineDb.sessions.put(updatedSession);
  await enqueueMutation({
    type: 'exercise_execution',
    op: 'upsert',
    payload: {
      id: executionId,
      workoutSessionId: sessionId,
      exerciseLibraryId: exercise.id,
      sortOrder: newExercise.sortOrder,
      status: 'pending',
      prescriptionSnapshot: newExercise.prescription,
    },
  });

  for (const set of newExercise.sets) {
    await enqueueMutation({
      type: 'set_log',
      op: 'upsert',
      payload: {
        id: set.id,
        exerciseExecutionId: executionId,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        isWarmup: set.isWarmup,
        isCompleted: set.isCompleted,
        isSkipped: set.isSkipped,
        isFailed: set.isFailed,
        clientTimestamp: set.clientTimestamp,
      },
    });
  }

  return updatedSession;
}

export async function completeWorkoutSessionClient(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const cached = await offlineDb.sessions.get(sessionId);

  if (isBrowserOnline()) {
    try {
      const session = await completeWorkoutSession(accessToken, sessionId);
      await offlineDb.sessions.put(session);
      await upsertCompletedSessionSummary(session);
      invalidateAndEmitWorkoutSaved();
      await syncIfOnline(accessToken);
      return session;
    } catch (error) {
      if (isSessionNotFoundError(error)) {
        await purgeLocalSession(sessionId);
        if (cached) {
          const completedAt = new Date().toISOString();
          return {
            ...cached,
            status: 'completed',
            completedAt,
            durationSeconds: Math.max(
              0,
              Math.floor((Date.parse(completedAt) - Date.parse(cached.startedAt)) / 1000),
            ),
          };
        }
      }
      throw error;
    }
  }

  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }

  const completedAt = new Date().toISOString();
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.parse(completedAt) - Date.parse(session.startedAt)) / 1000),
  );

  const updatedSession: WorkoutSessionDetail = {
    ...session,
    status: 'completed',
    completedAt,
    durationSeconds,
  };

  await offlineDb.sessions.put(updatedSession);
  await upsertCompletedSessionSummary(updatedSession);
  invalidateAndEmitWorkoutSaved();
  await enqueueMutation({
    type: 'workout_session',
    op: 'upsert',
    payload: {
      id: session.id,
      programAssignmentId: session.programAssignmentId,
      workoutDayId: session.workoutDayId,
      status: 'completed',
      sessionType: session.sessionType,
      startedAt: session.startedAt,
      completedAt,
      durationSeconds,
      clientUpdatedAt: completedAt,
    },
  });

  return updatedSession;
}

export async function abandonWorkoutSessionClient(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const cached = await offlineDb.sessions.get(sessionId);

  if (isBrowserOnline()) {
    try {
      const session = await abandonWorkoutSession(accessToken, sessionId);
      await offlineDb.sessions.put(session);
      await syncIfOnline(accessToken);
      return session;
    } catch (error) {
      if (isSessionNotFoundError(error)) {
        await purgeLocalSession(sessionId);
        await syncIfOnline(accessToken);
        const completedAt = new Date().toISOString();
        if (cached) {
          return { ...cached, status: 'abandoned', completedAt };
        }
        return {
          id: sessionId,
          status: 'abandoned',
          sessionType: 'free',
          programAssignmentId: null,
          workoutDayId: null,
          workoutDayLabel: null,
          workoutDayDifficultyLevel: null,
          startedAt: completedAt,
          completedAt,
          durationSeconds: null,
          privateNotes: null,
          exercises: [],
        };
      }
      throw error;
    }
  }

  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }

  const completedAt = new Date().toISOString();
  const updatedSession: WorkoutSessionDetail = {
    ...session,
    status: 'abandoned',
    completedAt,
  };

  await offlineDb.sessions.put(updatedSession);
  await enqueueMutation({
    type: 'workout_session',
    op: 'upsert',
    payload: {
      id: session.id,
      programAssignmentId: session.programAssignmentId,
      workoutDayId: session.workoutDayId,
      status: 'abandoned',
      sessionType: session.sessionType,
      startedAt: session.startedAt,
      completedAt,
      durationSeconds: session.durationSeconds,
      clientUpdatedAt: completedAt,
    },
  });

  return updatedSession;
}

export async function searchExercisesClient(
  accessToken: string,
  query: string,
  filters: { muscle?: string; limit?: number; locale?: string } = {},
): Promise<ExerciseListItem[]> {
  const limit = filters.limit ?? EXERCISE_CATALOG_LIMIT;
  const locale = filters.locale ?? 'en';

  if (isBrowserOnline()) {
    const exercises = await searchExercises(accessToken, query, { muscle: filters.muscle, limit });
    return sortExercisesByDisplayName(exercises, locale);
  }

  const term = query.trim().toLowerCase();
  const all = await offlineDb.exercises.toArray();
  const filtered = all.filter((exercise) => {
    const matchesText =
      term.length === 0 ||
      exercise.names.en.toLowerCase().includes(term) ||
      (exercise.names.it?.toLowerCase().includes(term) ?? false) ||
      exercise.slug.toLowerCase().includes(term);
    const matchesMuscle =
      !filters.muscle || exercise.primaryMuscles.includes(filters.muscle as never);
    return matchesText && matchesMuscle;
  });

  return sortExercisesByDisplayName(filtered.slice(0, limit), locale);
}

export async function addWorkoutExerciseSetClient(
  accessToken: string,
  sessionId: string,
  executionId: string,
): Promise<WorkoutSessionDetail> {
  const setId = generateClientUuid();
  const clientTimestamp = new Date().toISOString();

  if (isBrowserOnline()) {
    const session = await addWorkoutExerciseSet(accessToken, sessionId, executionId, { id: setId });
    await offlineDb.sessions.put(session);
    await syncIfOnline(accessToken);
    return session;
  }

  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }

  const exercise = session.exercises.find((item) => item.id === executionId);
  if (!exercise) {
    throw new Error('Exercise not found locally');
  }

  const maxSetNumber = exercise.sets.reduce((max, set) => Math.max(max, set.setNumber), 0);
  if (maxSetNumber >= 30) {
    throw new Error('Maximum sets reached');
  }

  const lastSet = exercise.sets.find((set) => set.setNumber === maxSetNumber) ?? null;
  const newSet = {
    id: setId,
    setNumber: maxSetNumber + 1,
    weightKg: lastSet?.weightKg ?? null,
    reps: lastSet?.reps ?? null,
    rpe: null,
    rir: null,
    isWarmup: false,
    isCompleted: false,
    isSkipped: false,
    isFailed: false,
    clientTimestamp,
  };

  const updatedSession: WorkoutSessionDetail = {
    ...session,
    exercises: session.exercises.map((item) =>
      item.id === executionId
        ? {
            ...item,
            status: 'in_progress',
            sets: [...item.sets, newSet],
          }
        : item,
    ),
  };

  await offlineDb.sessions.put(updatedSession);
  await enqueueMutation({
    type: 'set_log',
    op: 'upsert',
    payload: {
      id: newSet.id,
      exerciseExecutionId: executionId,
      setNumber: newSet.setNumber,
      weightKg: newSet.weightKg,
      reps: newSet.reps,
      isWarmup: newSet.isWarmup,
      isCompleted: newSet.isCompleted,
      isSkipped: newSet.isSkipped,
      isFailed: newSet.isFailed,
      clientTimestamp: newSet.clientTimestamp,
    },
  });

  return updatedSession;
}

export async function skipWorkoutExerciseClient(
  accessToken: string,
  sessionId: string,
  executionId: string,
): Promise<WorkoutSessionDetail> {
  if (!isBrowserOnline()) {
    throw new Error('Skipping exercises requires an internet connection');
  }
  const session = await skipWorkoutExercise(accessToken, sessionId, executionId);
  await offlineDb.sessions.put(session);
  await syncIfOnline(accessToken);
  return session;
}

export async function substituteWorkoutExerciseClient(
  accessToken: string,
  sessionId: string,
  executionId: string,
  exerciseLibraryId: string,
): Promise<WorkoutSessionDetail> {
  if (!isBrowserOnline()) {
    throw new Error('Substituting exercises requires an internet connection');
  }
  const session = await substituteWorkoutExercise(accessToken, sessionId, executionId, {
    exerciseLibraryId,
  });
  await offlineDb.sessions.put(session);
  await syncIfOnline(accessToken);
  return session;
}

export async function updateWorkoutSessionNotesClient(
  accessToken: string,
  sessionId: string,
  privateNotes: string | null,
): Promise<WorkoutSessionDetail> {
  if (isBrowserOnline()) {
    const session = await updateWorkoutSessionNotes(accessToken, sessionId, { privateNotes });
    await offlineDb.sessions.put(session);
    return session;
  }

  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }
  const updated: WorkoutSessionDetail = { ...session, privateNotes };
  await offlineDb.sessions.put(updated);
  return updated;
}

export async function updateWorkoutExerciseNotesClient(
  accessToken: string,
  sessionId: string,
  executionId: string,
  athleteNotes: string | null,
): Promise<WorkoutSessionDetail> {
  if (isBrowserOnline()) {
    const session = await updateWorkoutExerciseNotes(accessToken, sessionId, executionId, {
      athleteNotes,
    });
    await offlineDb.sessions.put(session);
    return session;
  }

  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }

  const updated: WorkoutSessionDetail = {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id === executionId ? { ...exercise, athleteNotes } : exercise,
    ),
  };
  await offlineDb.sessions.put(updated);
  return updated;
}

function invalidateAndEmitWorkoutSaved(): void {
  invalidateDashboardCache();
  emitDashboardInvalidation('WORKOUT_SAVED');
}
