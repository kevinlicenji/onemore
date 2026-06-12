/** Controlled exercise category vocabulary for system catalog entries. */
export const EXERCISE_CATEGORIES = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
  'full_body',
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export function isExerciseCategory(value: string): value is ExerciseCategory {
  return (EXERCISE_CATEGORIES as readonly string[]).includes(value);
}
