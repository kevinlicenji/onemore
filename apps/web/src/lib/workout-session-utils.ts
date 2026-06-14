import type { WorkoutSessionDetail } from '@onemore/shared';

/**
 * True when the athlete logged at least one completed working set in the session.
 */
export function hasCompletedWorkingSet(session: WorkoutSessionDetail): boolean {
  return session.exercises.some((exercise) =>
    exercise.sets.some((set) => set.isCompleted && !set.isWarmup),
  );
}
