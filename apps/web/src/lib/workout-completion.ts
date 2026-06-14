import type { WorkoutSessionDetail } from '@onemore/shared';

import type { WorkoutExerciseDetail } from '@/lib/workout-exercise-set-state';

/**
 * True when every set on the exercise is completed or skipped.
 */
export function isExerciseFullyResolved(exercise: WorkoutExerciseDetail): boolean {
  return exercise.sets.every((set) => set.isCompleted || set.isSkipped);
}

/**
 * Returns the last set row in sort order (highest set number).
 */
export function getLastExerciseSet(
  exercise: WorkoutExerciseDetail,
): WorkoutExerciseDetail['sets'][number] | null {
  if (exercise.sets.length === 0) {
    return null;
  }
  return exercise.sets[exercise.sets.length - 1] ?? null;
}

/**
 * Offer "add set" only when the athlete completed at least one set and did not skip the last one.
 */
export function shouldOfferAddSet(exercise: WorkoutExerciseDetail): boolean {
  if (exercise.status === 'skipped') {
    return false;
  }
  if (!isExerciseFullyResolved(exercise)) {
    return false;
  }
  if (!exercise.sets.some((set) => set.isCompleted)) {
    return false;
  }
  const lastSet = getLastExerciseSet(exercise);
  return lastSet !== null && !lastSet.isSkipped;
}

/**
 * Auto-advance once every set on the exercise is resolved.
 */
export function shouldAutoAdvanceFromExercise(exercise: WorkoutExerciseDetail): boolean {
  return isExerciseFullyResolved(exercise);
}

/**
 * True when every exercise in the session is completed or skipped.
 */
export function isWorkoutFullyResolved(session: WorkoutSessionDetail): boolean {
  return (
    session.exercises.length > 0 &&
    session.exercises.every(
      (exercise) => exercise.status === 'completed' || exercise.status === 'skipped',
    )
  );
}

/**
 * Index of the next exercise that still needs work, or -1 when none remain.
 */
export function findNextActiveExerciseIndex(
  session: WorkoutSessionDetail,
  currentIndex: number,
): number {
  return session.exercises.findIndex(
    (exercise, index) =>
      index > currentIndex && exercise.status !== 'completed' && exercise.status !== 'skipped',
  );
}

/**
 * Auto-finish when every exercise is terminal and no optional add-set prompts remain.
 */
export function isWorkoutReadyToAutoFinish(session: WorkoutSessionDetail): boolean {
  if (!isWorkoutFullyResolved(session)) {
    return false;
  }
  return !session.exercises.some((exercise) => shouldOfferAddSet(exercise));
}
