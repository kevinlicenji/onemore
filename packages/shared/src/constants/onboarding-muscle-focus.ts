import { type MuscleGroup } from './muscle-groups.js';

export const ONBOARDING_MUSCLE_FOCUS_IDS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'glutes',
  'core',
  'balanced',
] as const;

export type OnboardingMuscleFocusId = (typeof ONBOARDING_MUSCLE_FOCUS_IDS)[number];

export interface OnboardingMuscleFocusOption {
  id: OnboardingMuscleFocusId;
  muscles: MuscleGroup[];
}

/** Visual onboarding cards mapped to controlled muscle-group tags. */
export const ONBOARDING_MUSCLE_FOCUS_OPTIONS: OnboardingMuscleFocusOption[] = [
  { id: 'chest', muscles: ['chest'] },
  { id: 'back', muscles: ['back'] },
  { id: 'shoulders', muscles: ['shoulders'] },
  { id: 'arms', muscles: ['biceps', 'triceps'] },
  { id: 'legs', muscles: ['quadriceps', 'hamstrings', 'calves'] },
  { id: 'glutes', muscles: ['glutes'] },
  { id: 'core', muscles: ['core'] },
  { id: 'balanced', muscles: ['full_body'] },
];

const FOCUS_OPTION_MAP = new Map(
  ONBOARDING_MUSCLE_FOCUS_OPTIONS.map((option) => [option.id, option]),
);

/**
 * Flattens selected onboarding cards into stored muscle-group slugs.
 *
 * @param selected - Selected visual focus card ids.
 * @returns Deduplicated muscle tags for persistence.
 */
export function flattenMuscleFocusSelections(selected: OnboardingMuscleFocusId[]): MuscleGroup[] {
  const muscles = new Set<MuscleGroup>();

  for (const id of selected) {
    const option = FOCUS_OPTION_MAP.get(id);
    if (!option) {
      continue;
    }
    for (const muscle of option.muscles) {
      muscles.add(muscle);
    }
  }

  return [...muscles];
}

/**
 * @param value - Raw stored slug.
 * @returns Whether the value is a known onboarding focus card id.
 */
export function isOnboardingMuscleFocusId(value: string): value is OnboardingMuscleFocusId {
  return (ONBOARDING_MUSCLE_FOCUS_IDS as readonly string[]).includes(value);
}
