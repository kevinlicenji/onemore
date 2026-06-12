import type { WorkoutSessionDetail } from '@onemore/shared';

export interface WorkoutSessionStats {
  exerciseCount: number;
  completedSets: number;
  skippedSets: number;
  totalVolumeKg: number;
}

/**
 * Aggregate completed volume and set counts from a session detail payload.
 *
 * @param session - Workout session with exercises and sets.
 */
export function computeWorkoutSessionStats(session: WorkoutSessionDetail): WorkoutSessionStats {
  let completedSets = 0;
  let skippedSets = 0;
  let totalVolumeKg = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (set.isSkipped) {
        skippedSets += 1;
      }
      if (set.isCompleted && !set.isWarmup) {
        completedSets += 1;
        if (set.weightKg !== null && set.reps !== null) {
          totalVolumeKg += set.weightKg * set.reps;
        }
      }
    }
  }

  return {
    exerciseCount: session.exercises.length,
    completedSets,
    skippedSets,
    totalVolumeKg: Math.round(totalVolumeKg),
  };
}
