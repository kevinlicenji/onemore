export interface SessionExerciseInput {
  targetSets: number;
  targetReps: number;
  restSeconds: number;
}

const SECONDS_PER_REP = 3;
const TRANSITION_SECONDS = 60;
const WARMUP_MINUTES = 8;
const MIN_SESSION_MINUTES = 15;
const MAX_SESSION_MINUTES = 180;

/**
 * Estimates active work time for one set from the prescribed reps.
 *
 * @param reps - Target reps (timed holds often use 20–120 as seconds).
 * @returns Estimated work seconds for a single set.
 */
export function estimateSetWorkSeconds(reps: number): number {
  if (reps <= 0) {
    return 30;
  }
  if (reps >= 20 && reps <= 120) {
    return reps;
  }
  return Math.min(90, Math.round(reps * SECONDS_PER_REP));
}

/**
 * Estimates total session duration from prescribed sets, reps, and rest.
 *
 * @param exercises - Exercises planned for a single workout day.
 * @returns Rounded session length in minutes.
 */
export function estimateSessionMinutes(exercises: SessionExerciseInput[]): number {
  if (exercises.length === 0) {
    return MIN_SESSION_MINUTES;
  }

  let totalSeconds = 0;

  for (const exercise of exercises) {
    const workPerSet = estimateSetWorkSeconds(exercise.targetReps);
    const work = workPerSet * exercise.targetSets;
    const rest = exercise.restSeconds * Math.max(0, exercise.targetSets - 1);
    totalSeconds += work + rest + TRANSITION_SECONDS;
  }

  const minutes = Math.round(totalSeconds / 60) + WARMUP_MINUTES;
  return Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, minutes));
}
