import {
  isMuscleGroup,
  MUSCLE_GROUP_DISPLAY_ORDER,
  type MuscleGroup,
  normalizeMuscleTags,
} from '../constants/muscle-groups.js';

interface ExerciseWithMuscleTags {
  primaryMuscles: string[];
}

/**
 * Collect unique muscle tags from a list of exercises, in canonical display order.
 *
 * @param exercises - Exercises with `primaryMuscles` tag arrays.
 * @returns Ordered unique muscle groups for the workout day.
 */
export function aggregateMuscleGroups(exercises: ExerciseWithMuscleTags[]): MuscleGroup[] {
  const found = new Set<MuscleGroup>();

  for (const exercise of exercises) {
    const tags = normalizeMuscleTags(exercise.primaryMuscles);
    for (const tag of tags) {
      found.add(tag);
    }
  }

  return MUSCLE_GROUP_DISPLAY_ORDER.filter((group) => found.has(group));
}

/**
 * @param tags - Muscle group slugs.
 * @returns Tags sorted in canonical display order.
 */
export function sortMuscleGroups(tags: string[]): MuscleGroup[] {
  const normalized = normalizeMuscleTags(tags);
  return MUSCLE_GROUP_DISPLAY_ORDER.filter((group) => normalized.includes(group));
}

/**
 * @param tags - Muscle group slugs.
 * @param labels - Map from slug to localized label.
 * @returns Comma-separated localized labels.
 */
export function formatMuscleGroupLabels(
  tags: string[],
  labels: Record<MuscleGroup, string>,
): string {
  return sortMuscleGroups(tags)
    .map((tag) => labels[tag])
    .join(', ');
}

/**
 * @param value - Candidate tag from user input or API.
 * @returns Parsed muscle group or null.
 */
export function parseMuscleGroup(value: string): MuscleGroup | null {
  return isMuscleGroup(value) ? value : null;
}
