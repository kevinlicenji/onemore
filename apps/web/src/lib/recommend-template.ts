import type { TemplateSummary, TrainingEnvironment, TrainingLevel } from '@onemore/shared';

interface ProfileHints {
  trainingLevel?: TrainingLevel;
  trainingEnvironment?: TrainingEnvironment;
  trainingDaysPerWeek?: number;
}

const FALLBACK_SLUGS: Record<TrainingEnvironment, string> = {
  gym: 'beginner_machine_gym_3day',
  home: 'home_bodyweight_3day',
};

function scoreTemplate(
  template: TemplateSummary,
  environment: TrainingEnvironment,
  levelToken: string,
  days: number,
): number {
  const audience = template.audience.toLowerCase();
  let score = 0;

  const envMatch = environment === 'home' ? audience.includes('home') : audience.includes('gym');
  if (!envMatch) {
    return -1;
  }

  if (audience.includes(levelToken)) {
    score += 50;
  }

  if (environment === 'gym' && levelToken === 'beginner' && template.equipmentProfile === 'machines') {
    score += 30;
  }

  if (environment === 'home' && template.equipmentProfile === 'bodyweight') {
    score += 20;
  }

  score -= Math.abs(template.daysPerWeek - days) * 5;
  return score;
}

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
  const levelToken = level === 'advanced' ? 'advanced' : level;

  const ranked = templates
    .map((template) => ({
      template,
      score: scoreTemplate(template, environment, levelToken, days),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score);

  if (ranked.length > 0) {
    return ranked[0]?.template.slug ?? null;
  }

  return FALLBACK_SLUGS[environment];
}
