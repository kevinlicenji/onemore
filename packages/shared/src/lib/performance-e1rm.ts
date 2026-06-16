import { computeE1rm } from '../pr/e1rm.js';

/**
 * Estimated 1RM for in-workout performance feedback (Algorithm Spec §2).
 * Delegates to the canonical {@link computeE1rm} implementation.
 */

/**
 * Compute estimated 1RM for performance delta feedback.
 *
 * @param weightKg - Load in kilograms.
 * @param reps - Completed rep count.
 * @returns Estimated 1RM in kg, or null when not computable.
 */
export function computePerformanceE1rm(weightKg: number, reps: number): number | null {
  return computeE1rm(weightKg, reps);
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
