import { clampDifficultyLevel, type DifficultyLevel } from '../constants/difficulty-level.js';

/**
 * Program difficulty is the hardest day in the schedule (max level).
 *
 * @param dayLevels - Difficulty level per workout day.
 * @returns Aggregated program difficulty (defaults to 2 when empty).
 */
export function aggregateProgramDifficulty(dayLevels: number[]): DifficultyLevel {
  if (dayLevels.length === 0) {
    return 2;
  }
  return clampDifficultyLevel(Math.max(...dayLevels));
}
