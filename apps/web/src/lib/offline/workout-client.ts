import type {
  AddWorkoutExerciseInput,
  ExerciseListItem,
  NextWorkoutPreview,
  StartWorkoutSessionInput,
  UpsertSetLogInput,
  UpsertSetResponse,
  WorkoutSessionDetail,
} from '@onemore/shared';

import {
  abandonWorkoutSession,
  addWorkoutExercise,
  completeWorkoutSession,
  fetchActiveWorkoutSession,
  fetchNextWorkoutPreview,
  fetchWorkoutSession,
  searchExercises,
  startWorkoutSession,
  upsertWorkoutSet,
} from '@/lib/api-auth';

import { offlineDb } from './db';
import { enqueueMutation, flushSyncQueue, isBrowserOnline } from './sync-engine';

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

function buildLocalProgrammedSession(
  input: StartWorkoutSessionInput,
  preview: NextWorkoutPreview,
): WorkoutSessionDetail {
  const startedAt = new Date().toISOString();
  const selectedDayId = input.workoutDayId ?? preview.workoutDayId;
  const selectedDay =
    preview.days.find((day) => day.workoutDayId === selectedDayId) ?? preview.days[0] ?? null;
  const dayExercises = selectedDay?.exercises ?? preview.exercises;

  return {
    id: input.id,
    status: 'in_progress',
    sessionType: 'programmed',
    programAssignmentId: preview.programAssignmentId,
    workoutDayId: selectedDay?.workoutDayId ?? preview.workoutDayId,
    workoutDayLabel: selectedDay?.label ?? preview.workoutDayLabel,
    startedAt,
    completedAt: null,
    durationSeconds: null,
    exercises: dayExercises.map((item, index) => {
      const executionId = crypto.randomUUID();
      return {
        id: executionId,
        exerciseLibraryId: item.exerciseLibraryId,
        sortOrder: index,
        status: 'pending' as const,
        prescription: {
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          targetWeightKg: item.targetWeightKg,
          restSeconds: item.restSeconds,
          coachNote: item.coachNote,
        },
        exercise: item.exercise,
        previousSet: null,
        sets: Array.from({ length: item.targetSets }, (_, setIndex) => ({
          id: crypto.randomUUID(),
          setNumber: setIndex + 1,
          weightKg: null,
          reps: null,
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

export async function getActiveWorkoutSessionClient(
  accessToken: string,
): Promise<WorkoutSessionDetail | null> {
  const local = await offlineDb.sessions.where('status').equals('in_progress').first();

  if (local) {
    return local;
  }

  if (!isBrowserOnline()) {
    return null;
  }

  const remote = await fetchActiveWorkoutSession(accessToken);
  if (remote) {
    await offlineDb.sessions.put(remote);
  }
  return remote;
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
    const session = buildLocalProgrammedSession(input, preview);
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
    startedAt,
    completedAt: null,
    durationSeconds: null,
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

export async function upsertWorkoutSetClient(
  accessToken: string,
  sessionId: string,
  payload: UpsertSetLogInput,
): Promise<UpsertSetResponse> {
  if (isBrowserOnline()) {
    const result = await upsertWorkoutSet(accessToken, sessionId, payload);
    await offlineDb.sessions.put(result.session);
    await syncIfOnline(accessToken);
    return result;
  }

  const session = await offlineDb.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found locally');
  }

  const updatedExercises = session.exercises.map((exercise) => {
    if (exercise.id !== payload.exerciseExecutionId) {
      return exercise;
    }

    const sets = exercise.sets.map((set) =>
      set.setNumber === payload.setNumber
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
  await enqueueMutation({
    type: 'set_log',
    op: 'upsert',
    payload,
  });
  return { session: updatedSession, personalRecords: [] };
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

  const executionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const newExercise = {
    id: executionId,
    exerciseLibraryId: exercise.id,
    sortOrder: session.exercises.length,
    status: 'pending' as const,
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
    },
    previousSet: null,
    sets: Array.from({ length: payload.targetSets }, (_, index) => ({
      id: crypto.randomUUID(),
      setNumber: index + 1,
      weightKg: null,
      reps: payload.targetReps,
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
  if (isBrowserOnline()) {
    const session = await completeWorkoutSession(accessToken, sessionId);
    await offlineDb.sessions.put(session);
    await syncIfOnline(accessToken);
    return session;
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
  if (isBrowserOnline()) {
    const session = await abandonWorkoutSession(accessToken, sessionId);
    await offlineDb.sessions.put(session);
    await syncIfOnline(accessToken);
    return session;
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
): Promise<ExerciseListItem[]> {
  if (isBrowserOnline()) {
    return searchExercises(accessToken, query);
  }

  const term = query.trim().toLowerCase();
  const all = await offlineDb.exercises.toArray();
  return all
    .filter(
      (exercise) =>
        exercise.names.en.toLowerCase().includes(term) ||
        exercise.slug.toLowerCase().includes(term),
    )
    .slice(0, 20);
}
