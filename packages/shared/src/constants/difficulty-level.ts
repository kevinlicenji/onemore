import { z } from 'zod';

/** Workout day / program difficulty on a 1 (easy) – 3 (hard) scale. */
export const difficultyLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;

/**
 * Clamps an unknown numeric value to a valid difficulty level.
 *
 * @param value - Raw level from storage or computation.
 * @returns Valid difficulty level (defaults to 2).
 */
export function clampDifficultyLevel(value: number): DifficultyLevel {
  if (value <= 1) {
    return 1;
  }
  if (value >= 3) {
    return 3;
  }
  return 2;
}
