import type { ExerciseListItem } from '@onemore/shared';

/**
 * Localized exercise label for list and search UIs.
 */
export function getExerciseDisplayName(
  exercise: Pick<ExerciseListItem, 'names'>,
  locale: string,
): string {
  if (locale === 'it' && exercise.names.it) {
    return exercise.names.it;
  }
  return exercise.names.en;
}
