/**
 * Controlled muscle-group tags stored in `primaryMuscles` on each exercise.
 * Max 3 tags per exercise; only clearly involved groups.
 */
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'lower_back',
  'traps',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
  'abductors',
  'core',
  'cardio',
  'full_body',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/** Stable display order when aggregating tags for a workout day. */
export const MUSCLE_GROUP_DISPLAY_ORDER: MuscleGroup[] = [...MUSCLE_GROUPS];

const MUSCLE_GROUP_SET = new Set<string>(MUSCLE_GROUPS);

/**
 * @param value - Candidate muscle slug.
 * @returns Whether the value is a known muscle group tag.
 */
export function isMuscleGroup(value: string): value is MuscleGroup {
  return MUSCLE_GROUP_SET.has(value);
}

/**
 * Normalize legacy or imported muscle slugs into controlled tags.
 *
 * @param muscles - Raw muscle strings from seed/import.
 * @returns Valid muscle groups (deduped, max 3).
 */
export function normalizeMuscleTags(muscles: string[]): MuscleGroup[] {
  const result: MuscleGroup[] = [];

  for (const raw of muscles) {
    const mapped = mapLegacyMuscle(raw);
    if (mapped && !result.includes(mapped)) {
      result.push(mapped);
    }
    if (result.length >= 3) {
      break;
    }
  }

  return result;
}

function mapLegacyMuscle(raw: string): MuscleGroup | null {
  const value = raw.toLowerCase().trim();
  if (isMuscleGroup(value)) {
    return value;
  }

  switch (value) {
    case 'legs':
    case 'quads':
      return 'quadriceps';
    case 'abs':
    case 'abdominals':
      return 'core';
    case 'lats':
    case 'latissimus':
      return 'back';
    case 'rear_delts':
    case 'rear_deltoids':
      return 'shoulders';
    case 'arms':
      return null;
    default:
      return null;
  }
}
