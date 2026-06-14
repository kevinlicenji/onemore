/**
 * Whether a set has enough logged reps to be marked complete.
 *
 * @param reps - Logged repetition count (null when empty).
 */
export function canCompleteWorkoutSet(reps: number | null): boolean {
  return reps !== null && reps > 0;
}
