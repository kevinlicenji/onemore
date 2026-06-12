import type { TemplateSummary, TrainingEnvironment, TrainingLevel } from '@onemore/shared';

interface ProfileHints {
  trainingLevel?: TrainingLevel;
  trainingEnvironment?: TrainingEnvironment;
  trainingDaysPerWeek?: number;
}

const FALLBACK_SLUGS: Record<TrainingEnvironment, string> = {
  gym: 'beginner_full_body_gym',
  home: 'home_bodyweight_3day',
};

/**
 * Pick the best-matching program template for a new athlete profile.
 *
 * @param profile - Onboarding training preferences.
 * @param templates - Available system templates.
 * @returns Template slug or null when the catalog is empty.
 */
export function recommendTemplateSlug(
  profile: ProfileHints,
  templates: TemplateSummary[],
): string | null {
  if (templates.length === 0) {
    return null;
  }

  const environment = profile.trainingEnvironment ?? 'gym';
  const level = profile.trainingLevel ?? 'beginner';
  const days = profile.trainingDaysPerWeek ?? 3;

  const levelToken = level === 'advanced' ? 'intermediate' : level;

  const candidates = templates.filter((template) => {
    const audience = template.audience.toLowerCase();
    const envMatch = environment === 'home' ? audience.includes('home') : audience.includes('gym');
    const levelMatch = audience.includes(levelToken);
    return envMatch && levelMatch;
  });

  const pool = candidates.length > 0 ? candidates : templates;

  const sorted = [...pool].sort((left, right) => {
    const leftDiff = Math.abs(left.daysPerWeek - days);
    const rightDiff = Math.abs(right.daysPerWeek - days);
    return leftDiff - rightDiff;
  });

  return sorted[0]?.slug ?? FALLBACK_SLUGS[environment];
}
