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

/**
 * Sort exercises alphabetically by localized display name.
 */
export function sortExercisesByDisplayName(
  exercises: ExerciseListItem[],
  locale: string,
): ExerciseListItem[] {
  return [...exercises].sort((left, right) =>
    getExerciseDisplayName(left, locale).localeCompare(getExerciseDisplayName(right, locale), locale, {
      sensitivity: 'base',
    }),
  );
}
