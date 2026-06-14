/**
 * Estimated 1RM for in-workout performance feedback (spec formulas).
 * Brzycki for reps ≤ 10; Epley for reps > 10.
 */

/**
 * Compute estimated 1RM for performance delta feedback.
 *
 * @param weightKg - Load in kilograms.
 * @param reps - Completed rep count.
 * @returns Estimated 1RM in kg, or null when not computable.
 */
export function computePerformanceE1rm(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0) {
    return null;
  }

  if (reps <= 10) {
    if (reps >= 37) {
      return null;
    }
    return weightKg * (36 / (37 - reps));
  }

  return weightKg * (1 + reps / 30);
}

/**
 * Percentage delta between current and baseline estimated 1RM.
 *
 * @param currentE1rm - e1RM from the set just completed.
 * @param baselineE1rm - Historical reference e1RM.
 */
export function computePerformanceDeltaPercent(
  currentE1rm: number,
  baselineE1rm: number,
): number | null {
  if (baselineE1rm <= 0) {
    return null;
  }
  return ((currentE1rm - baselineE1rm) / baselineE1rm) * 100;
}

export type PerformanceFeedbackTier = 'superior' | 'on_target' | 'fatigue';

/**
 * Classify performance delta into UI feedback tiers.
 *
 * @param deltaPercent - Percent change vs baseline e1RM.
 */
export function classifyPerformanceFeedback(deltaPercent: number): PerformanceFeedbackTier {
  if (deltaPercent >= 1) {
    return 'superior';
  }
  if (deltaPercent <= -3) {
    return 'fatigue';
  }
  return 'on_target';
}
