import type {
  PersonalRecordSummary,
  UpsertSetLogInput,
  WorkoutSessionDetail,
} from '@onemore/shared';
import { computeE1rm, computeSetVolume, roundPrValue, type PrType } from '@onemore/shared';

import { offlineDb } from './db';

/**
 * Detect personal records from a completed set using local session + IndexedDB history.
 * Mirrors server PR rules for offline preview; server remains authoritative on sync.
 */
export async function detectOfflinePersonalRecords(
  session: WorkoutSessionDetail,
  payload: UpsertSetLogInput,
): Promise<PersonalRecordSummary[]> {
  if (!payload.isCompleted || payload.isWarmup) {
    return [];
  }

  const weight = payload.weightKg ?? 0;
  const reps = payload.reps ?? 0;
  if (weight <= 0 || reps <= 0) {
    return [];
  }

  const exercise = session.exercises.find((item) => item.id === payload.exerciseExecutionId);
  if (!exercise) {
    return [];
  }

  const achievedAt = payload.clientTimestamp;
  const exerciseName =
    exercise.exercise.names.en || exercise.exercise.names.it || exercise.exercise.slug;
  const existingRecords = await offlineDb.personalRecords
    .where('exerciseLibraryId')
    .equals(exercise.exerciseLibraryId)
    .toArray();

  const newRecords: PersonalRecordSummary[] = [];

  const weightPr = tryWeightPr(
    existingRecords,
    exercise.exerciseLibraryId,
    exerciseName,
    weight,
    reps,
    achievedAt,
  );
  if (weightPr) {
    newRecords.push(weightPr);
  }

  const volume = computeSetVolume(weight, reps);
  if (volume !== null) {
    const volumePr = tryTypedPr(
      existingRecords,
      exercise.exerciseLibraryId,
      exerciseName,
      'volume_pr',
      roundPrValue(volume),
      null,
      achievedAt,
    );
    if (volumePr) {
      newRecords.push(volumePr);
    }
  }

  const e1rmPr = tryE1rmPr(
    session,
    exercise.exerciseLibraryId,
    exerciseName,
    achievedAt,
    existingRecords,
  );
  if (e1rmPr) {
    newRecords.push(e1rmPr);
  }

  return newRecords;
}

function tryWeightPr(
  existingRecords: PersonalRecordSummary[],
  exerciseLibraryId: string,
  exerciseName: string,
  weight: number,
  reps: number,
  achievedAt: string,
): PersonalRecordSummary | null {
  const sameReps = existingRecords.filter(
    (record) => record.prType === 'weight_pr' && record.reps === reps,
  );
  const best = sameReps.reduce<PersonalRecordSummary | null>((current, record) => {
    if (!current || record.value > current.value) {
      return record;
    }
    return current;
  }, null);

  if (best && weight <= best.value) {
    return null;
  }

  return {
    id: best?.id ?? crypto.randomUUID(),
    exerciseLibraryId,
    exerciseName,
    prType: 'weight_pr',
    reps,
    value: weight,
    achievedAt,
  };
}

function tryTypedPr(
  existingRecords: PersonalRecordSummary[],
  exerciseLibraryId: string,
  exerciseName: string,
  prType: PrType,
  value: number,
  reps: number | null,
  achievedAt: string,
): PersonalRecordSummary | null {
  const existing = existingRecords.find(
    (record) => record.prType === prType && record.exerciseLibraryId === exerciseLibraryId,
  );

  if (existing && existing.value >= value) {
    return null;
  }

  return {
    id: existing?.id ?? crypto.randomUUID(),
    exerciseLibraryId,
    exerciseName,
    prType,
    reps,
    value,
    achievedAt,
  };
}

function tryE1rmPr(
  session: WorkoutSessionDetail,
  exerciseLibraryId: string,
  exerciseName: string,
  achievedAt: string,
  existingRecords: PersonalRecordSummary[],
): PersonalRecordSummary | null {
  const exercise = session.exercises.find((item) => item.exerciseLibraryId === exerciseLibraryId);
  if (!exercise) {
    return null;
  }

  let sessionE1rm = 0;
  for (const set of exercise.sets) {
    if (!set.isCompleted || set.isWarmup) {
      continue;
    }
    const weight = set.weightKg ?? 0;
    const reps = set.reps ?? 0;
    const e1rm = computeE1rm(weight, reps);
    if (e1rm !== null && e1rm > sessionE1rm) {
      sessionE1rm = e1rm;
    }
  }

  if (sessionE1rm <= 0) {
    return null;
  }

  return tryTypedPr(
    existingRecords,
    exerciseLibraryId,
    exerciseName,
    'e1rm_pr',
    roundPrValue(sessionE1rm),
    null,
    achievedAt,
  );
}
