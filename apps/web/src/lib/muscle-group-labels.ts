import { formatMuscleGroupLabels, MUSCLE_GROUPS, type MuscleGroup } from '@onemore/shared';

type MuscleGroupTranslator = (key: MuscleGroup) => string;

/**
 * Build a slug → localized label map for muscle groups.
 *
 * @param translate - next-intl translator for the MuscleGroups namespace.
 */
export function buildMuscleGroupLabelMap(translate: MuscleGroupTranslator): Record<MuscleGroup, string> {
  return Object.fromEntries(MUSCLE_GROUPS.map((group) => [group, translate(group)])) as Record<
    MuscleGroup,
    string
  >;
}

/**
 * @param tags - Muscle group slugs.
 * @param translate - next-intl translator for the MuscleGroups namespace.
 */
export function formatMuscleGroupsForLocale(
  tags: string[],
  translate: MuscleGroupTranslator,
): string {
  return formatMuscleGroupLabels(tags, buildMuscleGroupLabelMap(translate));
}
