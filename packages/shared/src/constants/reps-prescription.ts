/** Stored DB/API value when the athlete should train to failure (cedimento). */
export const TARGET_REPS_TO_FAILURE = -1;

/**
 * Returns true when prescribed reps mean "as many reps as possible".
 */
export function isFailureReps(targetReps: number): boolean {
  return targetReps === TARGET_REPS_TO_FAILURE;
}

/**
 * Formats prescribed reps for UI labels.
 */
export function formatTargetRepsLabel(targetReps: number, failureLabel: string): string {
  if (isFailureReps(targetReps)) {
    return failureLabel;
  }
  return String(targetReps);
}
