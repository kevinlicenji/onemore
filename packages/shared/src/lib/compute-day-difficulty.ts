import { TARGET_REPS_TO_FAILURE } from '../constants/reps-prescription.js';
import { clampDifficultyLevel, type DifficultyLevel } from '../constants/difficulty-level.js';

export interface DayDifficultyExerciseInput {
  targetSets: number;
  targetReps: number;
  restSeconds: number;
}

/**
 * Estimates day difficulty from prescription volume, exercise count, and rest density.
 *
 * @param exercises - Exercises prescribed for the day.
 * @returns Difficulty level from 1 (easy) to 3 (hard).
 */
export function computeDayDifficulty(exercises: DayDifficultyExerciseInput[]): DifficultyLevel {
  if (exercises.length === 0) {
    return 2;
  }

  let score = 0;

  for (const exercise of exercises) {
    const effectiveReps =
      exercise.targetReps === TARGET_REPS_TO_FAILURE
        ? 12
        : Math.min(Math.max(exercise.targetReps, 1), 30);

    score += exercise.targetSets * effectiveReps * 0.12;
    score += exercise.targetSets * 1.5;

    if (exercise.restSeconds < 60) {
      score += 6;
    } else if (exercise.restSeconds < 90) {
      score += 3;
    }
  }

  score += exercises.length * 2.5;

  if (score < 22) {
    return 1;
  }
  if (score < 42) {
    return 2;
  }
  return 3;
}

/**
 * Resolves the stored difficulty level, computing from exercises when absent.
 *
 * @param exercises - Day exercises.
 * @param storedLevel - Optional persisted override.
 * @returns Final difficulty level.
 */
export function resolveDayDifficulty(
  exercises: DayDifficultyExerciseInput[],
  storedLevel?: number | null,
): DifficultyLevel {
  if (storedLevel !== undefined && storedLevel !== null) {
    return clampDifficultyLevel(storedLevel);
  }
  return computeDayDifficulty(exercises);
}
