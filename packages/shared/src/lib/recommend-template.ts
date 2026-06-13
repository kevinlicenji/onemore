import type { MuscleGroup } from '../constants/muscle-groups.js';
import type { TemplateSummary } from '../schemas/program.js';
import type { TrainingEnvironment, TrainingLevel } from '../schemas/user.js';

export interface TemplateRecommendationProfile {
  trainingLevel?: TrainingLevel;
  trainingEnvironment?: TrainingEnvironment;
  trainingDaysPerWeek?: number;
  preferredSessionMinutes?: number;
  preferredMuscleGroups?: MuscleGroup[];
}

export interface RankedTemplate {
  template: TemplateSummary;
  score: number;
}

const FALLBACK_SLUGS: Record<TrainingEnvironment, string> = {
  gym: 'beginner_machine_gym_3day',
  home: 'home_bodyweight_3day',
};

const SESSION_TOLERANCE_MINUTES = 20;

function environmentMatches(template: TemplateSummary, environment: TrainingEnvironment): boolean {
  const audience = template.audience.toLowerCase();
  return environment === 'home' ? audience.includes('home') : audience.includes('gym');
}

function scoreLevel(template: TemplateSummary, levelToken: string): number {
  const audience = template.audience.toLowerCase();
  if (!audience.includes(levelToken)) {
    return 0;
  }
  let score = 40;
  if (levelToken === 'beginner' && template.equipmentProfile === 'machines') {
    score += 15;
  }
  return score;
}

/**
 * Measures how much of a template's volume targets the athlete's preferred muscles.
 *
 * @param muscleVolumes - Weighted set counts per muscle on the template.
 * @param preferred - Muscle groups chosen during onboarding.
 * @returns Score from 0 to 100.
 */
export function scoreMusclePreferenceOverlap(
  muscleVolumes: Partial<Record<MuscleGroup, number>>,
  preferred: MuscleGroup[],
): number {
  if (preferred.length === 0 || preferred.includes('full_body')) {
    return 50;
  }

  const entries = Object.entries(muscleVolumes) as [MuscleGroup, number][];
  const templateTotal = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (templateTotal <= 0) {
    return 0;
  }

  let overlap = 0;
  for (const muscle of preferred) {
    overlap += muscleVolumes[muscle] ?? 0;
  }

  return Math.round((overlap / templateTotal) * 100);
}

function scoreTemplate(
  template: TemplateSummary,
  profile: Required<Pick<TemplateRecommendationProfile, 'trainingEnvironment'>> &
    TemplateRecommendationProfile,
): number {
  const environment = profile.trainingEnvironment;
  const level = profile.trainingLevel ?? 'beginner';
  const days = profile.trainingDaysPerWeek ?? 3;
  const sessionTarget = profile.preferredSessionMinutes ?? 60;
  const preferredMuscles = profile.preferredMuscleGroups ?? [];
  const levelToken = level === 'advanced' ? 'advanced' : level;

  if (!environmentMatches(template, environment)) {
    return -1;
  }

  if (template.daysPerWeek !== days) {
    return -1;
  }

  const sessionDelta = Math.abs(template.estimatedSessionMinutes - sessionTarget);
  if (sessionDelta > SESSION_TOLERANCE_MINUTES) {
    return -1;
  }

  let score = 100;
  score += scoreLevel(template, levelToken);

  if (environment === 'gym' && levelToken === 'beginner' && template.equipmentProfile === 'machines') {
    score += 20;
  }
  if (environment === 'home' && template.equipmentProfile === 'bodyweight') {
    score += 15;
  }

  score -= sessionDelta * 2;
  score += scoreMusclePreferenceOverlap(template.muscleVolumes, preferredMuscles);

  return score;
}

function scoreTemplateRelaxed(
  template: TemplateSummary,
  profile: Required<Pick<TemplateRecommendationProfile, 'trainingEnvironment'>> &
    TemplateRecommendationProfile,
): number {
  const environment = profile.trainingEnvironment;
  const level = profile.trainingLevel ?? 'beginner';
  const days = profile.trainingDaysPerWeek ?? 3;
  const sessionTarget = profile.preferredSessionMinutes ?? 60;
  const preferredMuscles = profile.preferredMuscleGroups ?? [];
  const levelToken = level === 'advanced' ? 'advanced' : level;

  if (!environmentMatches(template, environment)) {
    return -1;
  }

  let score = 0;
  score += scoreLevel(template, levelToken);
  score -= Math.abs(template.daysPerWeek - days) * 25;
  score -= Math.abs(template.estimatedSessionMinutes - sessionTarget) * 3;
  score += scoreMusclePreferenceOverlap(template.muscleVolumes, preferredMuscles);

  return score;
}

/**
 * Ranks templates for an athlete profile, preferring exact day count and session length.
 *
 * @param profile - Onboarding training preferences.
 * @param templates - Published template catalog.
 * @returns Templates sorted by descending match score.
 */
export function rankTemplates(
  profile: TemplateRecommendationProfile,
  templates: TemplateSummary[],
): RankedTemplate[] {
  if (templates.length === 0) {
    return [];
  }

  const environment = profile.trainingEnvironment ?? 'gym';
  const normalizedProfile = { ...profile, trainingEnvironment: environment };

  const strict = templates
    .map((template) => ({
      template,
      score: scoreTemplate(template, normalizedProfile),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score);

  if (strict.length > 0) {
    return strict;
  }

  return templates
    .map((template) => ({
      template,
      score: scoreTemplateRelaxed(template, normalizedProfile),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score);
}

/**
 * Pick the best-matching program template for a new athlete profile.
 *
 * @param profile - Onboarding training preferences.
 * @param templates - Available system templates.
 * @returns Template slug or null when the catalog is empty.
 */
export function recommendTemplateSlug(
  profile: TemplateRecommendationProfile,
  templates: TemplateSummary[],
): string | null {
  const ranked = rankTemplates(profile, templates);
  if (ranked.length > 0) {
    return ranked[0]?.template.slug ?? null;
  }

  const environment = profile.trainingEnvironment ?? 'gym';
  return FALLBACK_SLUGS[environment];
}
