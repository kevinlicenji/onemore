/**
 * Estimated one-rep max (e1RM) per Algorithm Spec §2.
 * Epley for reps 1–10; Brzycki for reps 11–15.
 */

/**
 * Compute e1RM for a completed set.
 *
 * @param weightKg - Load in kilograms.
 * @param reps - Rep count (1–15).
 * @returns Estimated 1RM in kg, or null when not computable.
 */
export function computeE1rm(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0 || reps > 15) {
    return null;
  }

  if (reps <= 10) {
    return weightKg * (1 + reps / 30);
  }

  if (reps >= 37) {
    return null;
  }

  return weightKg * (36 / (37 - reps));
}

/**
 * Single-set training volume (weight × reps).
 *
 * @param weightKg - Load in kilograms.
 * @param reps - Rep count.
 * @returns Volume in kg·reps, or null when not computable.
 */
export function computeSetVolume(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0) {
    return null;
  }
  return weightKg * reps;
}

/**
 * Round PR values to two decimal places for storage and display.
 *
 * @param value - Raw numeric value.
 * @returns Value rounded to hundredths.
 */
export function roundPrValue(value: number): number {
  return Math.round(value * 100) / 100;
}
