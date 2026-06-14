import {
  classifyPerformanceFeedback,
  computePerformanceDeltaPercent,
  computePerformanceE1rm,
  type PerformanceFeedbackTier,
} from '@onemore/shared';

import { offlineDb } from '@/lib/offline/db';

export interface SetPerformanceFeedback {
  tier: PerformanceFeedbackTier;
  deltaPercent: number;
}

/**
 * Max estimated 1RM across completed working sets in one exercise execution.
 *
 * @param sets - Set logs for the exercise execution.
 */
function maxE1rmFromSets(
  sets: Array<{
    weightKg: number | null;
    reps: number | null;
    isCompleted: boolean;
    isWarmup: boolean;
    isSkipped: boolean;
  }>,
): number | null {
  let best: number | null = null;

  for (const set of sets) {
    if (!set.isCompleted || set.isWarmup || set.isSkipped) {
      continue;
    }
    if (set.weightKg === null || set.reps === null) {
      continue;
    }
    const e1rm = computePerformanceE1rm(set.weightKg, set.reps);
    if (e1rm === null) {
      continue;
    }
    if (best === null || e1rm > best) {
      best = e1rm;
    }
  }

  return best;
}

/**
 * Average per-session max e1RM from up to the last 3 prior completed workouts.
 *
 * @param exerciseLibraryId - Exercise to match in history.
 * @param excludeSessionId - Current in-progress session id.
 */
export async function getBaselinePerformanceE1rm(
  exerciseLibraryId: string,
  excludeSessionId: string,
): Promise<number | null> {
  const sessions = await offlineDb.sessions
    .filter(
      (session) =>
        session.status === 'completed' &&
        session.id !== excludeSessionId &&
        session.completedAt !== null,
    )
    .toArray();

  const sorted = sessions.sort(
    (a, b) => Date.parse(b.completedAt ?? '0') - Date.parse(a.completedAt ?? '0'),
  );

  const sessionMaxes: number[] = [];

  for (const session of sorted) {
    const execution = session.exercises.find(
      (exercise) => exercise.exerciseLibraryId === exerciseLibraryId,
    );
    if (!execution) {
      continue;
    }

    const sessionMax = maxE1rmFromSets(execution.sets);
    if (sessionMax !== null) {
      sessionMaxes.push(sessionMax);
    }

    if (sessionMaxes.length >= 3) {
      break;
    }
  }

  if (sessionMaxes.length === 0) {
    return null;
  }

  const sum = sessionMaxes.reduce((total, value) => total + value, 0);
  return sum / sessionMaxes.length;
}

/**
 * Evaluate instant performance feedback for a completed working set.
 *
 * @param weightKg - Logged weight.
 * @param reps - Logged reps.
 * @param exerciseLibraryId - Exercise identifier.
 * @param sessionId - Current session id (excluded from history).
 */
export async function evaluateSetPerformanceFeedback(
  weightKg: number | null,
  reps: number | null,
  exerciseLibraryId: string,
  sessionId: string,
): Promise<SetPerformanceFeedback | null> {
  if (weightKg === null || reps === null || weightKg <= 0 || reps <= 0) {
    return null;
  }

  const currentE1rm = computePerformanceE1rm(weightKg, reps);
  if (currentE1rm === null) {
    return null;
  }

  const baselineE1rm = await getBaselinePerformanceE1rm(exerciseLibraryId, sessionId);
  if (baselineE1rm === null) {
    return null;
  }

  const deltaPercent = computePerformanceDeltaPercent(currentE1rm, baselineE1rm);
  if (deltaPercent === null) {
    return null;
  }

  return {
    tier: classifyPerformanceFeedback(deltaPercent),
    deltaPercent: Math.round(deltaPercent * 10) / 10,
  };
}
