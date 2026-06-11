import type { Prisma } from '@prisma/client';

import { computeSetVolume } from '@onemore/shared';

type SessionWithExecutions = Prisma.WorkoutSessionGetPayload<{
  include: {
    exerciseExecutions: {
      include: { setLogs: true };
    };
  };
}>;

/**
 * Whether a completed session counts toward consistency metrics (Algorithm Spec §5.1).
 *
 * @param session - Session with executions and set logs loaded.
 */
export function isConsistentCompletedSession(session: SessionWithExecutions): boolean {
  if (session.status !== 'completed' || !session.completedAt) {
    return false;
  }

  const completedSets = session.exerciseExecutions.flatMap((execution) =>
    execution.setLogs.filter((set) => set.isCompleted && !set.isWarmup),
  );
  const totalSets = completedSets.length;
  const durationMinutes = (session.durationSeconds ?? 0) / 60;
  const meetsDurationOrSets = durationMinutes >= 10 || totalSets >= 6;

  if (!meetsDurationOrSets) {
    return false;
  }

  if (session.sessionType === 'free') {
    return true;
  }

  const plannedExercises = session.exerciseExecutions.length;
  if (plannedExercises === 0) {
    return false;
  }

  const exercisesWithSets = session.exerciseExecutions.filter((execution) =>
    execution.setLogs.some((set) => set.isCompleted && !set.isWarmup),
  ).length;

  return exercisesWithSets / plannedExercises >= 0.5;
}

/**
 * Sum training volume for all completed working sets in a session.
 *
 * @param session - Session with executions and set logs loaded.
 */
export function computeSessionVolumeKg(session: SessionWithExecutions): number {
  let total = 0;
  for (const execution of session.exerciseExecutions) {
    for (const set of execution.setLogs) {
      if (!set.isCompleted || set.isWarmup) {
        continue;
      }
      const weight = set.weightKg !== null ? Number(set.weightKg) : 0;
      const reps = set.reps ?? 0;
      const volume = computeSetVolume(weight, reps);
      if (volume !== null) {
        total += volume;
      }
    }
  }
  return Math.round(total * 100) / 100;
}
