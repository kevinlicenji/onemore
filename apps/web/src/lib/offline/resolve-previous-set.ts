import type { WorkoutSessionDetail } from '@onemore/shared';

import { offlineDb } from './db';

export interface PreviousSetValues {
  weightKg: number | null;
  reps: number | null;
}

interface CompletedSetCandidate extends PreviousSetValues {
  clientTimestamp: string;
}

/**
 * Finds the most recent completed working set for an exercise across stored sessions.
 *
 * @param sessions - Completed (or mixed) workout sessions from local storage.
 * @param exerciseLibraryId - Exercise to match.
 * @param options.excludeSessionId - Skip sets from this session (e.g. the one being started).
 * @returns Last completed set values or null when no history exists.
 *
 * @example
 * const previous = findPreviousSetInSessions(sessions, exerciseId, { excludeSessionId: newSessionId });
 */
export function findPreviousSetInSessions(
  sessions: WorkoutSessionDetail[],
  exerciseLibraryId: string,
  options?: { excludeSessionId?: string },
): PreviousSetValues | null {
  let best: CompletedSetCandidate | null = null;

  for (const session of sessions) {
    if (session.status !== 'completed') {
      continue;
    }
    if (options?.excludeSessionId && session.id === options.excludeSessionId) {
      continue;
    }

    for (const exercise of session.exercises) {
      if (exercise.exerciseLibraryId !== exerciseLibraryId) {
        continue;
      }

      for (const set of exercise.sets) {
        if (!set.isCompleted || set.isWarmup) {
          continue;
        }

        if (!best || set.clientTimestamp > best.clientTimestamp) {
          best = {
            weightKg: set.weightKg,
            reps: set.reps,
            clientTimestamp: set.clientTimestamp,
          };
        }
      }
    }
  }

  if (!best) {
    return null;
  }

  return {
    weightKg: best.weightKg,
    reps: best.reps,
  };
}

/**
 * Loads previous-set values for multiple exercises from IndexedDB completed sessions.
 *
 * @param exerciseLibraryIds - Exercises to resolve history for.
 * @param excludeSessionId - Optional in-progress session to exclude from lookup.
 * @returns Map of exercise id to last completed set values.
 *
 * @example
 * const map = await loadPreviousSetsMap(['uuid-a', 'uuid-b'], sessionId);
 */
export async function loadPreviousSetsMap(
  exerciseLibraryIds: string[],
  excludeSessionId?: string,
): Promise<Map<string, PreviousSetValues>> {
  const uniqueIds = [...new Set(exerciseLibraryIds)];
  const completedSessions = await offlineDb.sessions.where('status').equals('completed').toArray();
  const result = new Map<string, PreviousSetValues>();

  for (const exerciseLibraryId of uniqueIds) {
    const previous = findPreviousSetInSessions(completedSessions, exerciseLibraryId, {
      excludeSessionId,
    });
    if (previous) {
      result.set(exerciseLibraryId, previous);
    }
  }

  return result;
}
