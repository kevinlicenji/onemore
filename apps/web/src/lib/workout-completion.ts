import type { WorkoutSessionDetail } from '@onemore/shared';

import type { WorkoutExerciseDetail } from '@/lib/workout-exercise-set-state';

/**
 * True when every set on the exercise is completed or skipped.
 */
export function isExerciseFullyResolved(exercise: WorkoutExerciseDetail): boolean {
  return exercise.sets.every((set) => set.isCompleted || set.isSkipped);
}

/**
 * Offer "add set" only when the athlete logged at least one completed set.
 * All-skipped exercises should advance instead of prompting for extra work.
 */
export function shouldOfferAddSet(exercise: WorkoutExerciseDetail): boolean {
  if (exercise.status === 'skipped') {
    return false;
  }
  if (!isExerciseFullyResolved(exercise)) {
    return false;
  }
  return exercise.sets.some((set) => set.isCompleted);
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
