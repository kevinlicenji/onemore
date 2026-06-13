import type { MuscleGroup, TemplateSummary } from '@onemore/shared';
import { rankTemplates, recommendTemplateSlug } from '@onemore/shared';
import { describe, expect, it } from 'vitest';

function buildTemplate(
  slug: string,
  overrides: Partial<TemplateSummary> & Pick<TemplateSummary, 'audience' | 'daysPerWeek'>,
): TemplateSummary {
  return {
    slug,
    name: slug,
    description: null,
    guide: null,
    objective: 'fitness',
    equipmentProfile: 'mixed',
    split: 'full_body',
    estimatedSessionMinutes: 60,
    muscleVolumes: {},
    ...overrides,
  };
}

const templates: TemplateSummary[] = [
  buildTemplate('beginner_machine_gym_3day', {
    audience: 'beginner, gym',
    daysPerWeek: 3,
    equipmentProfile: 'machines',
    muscleVolumes: { chest: 9, back: 9, quadriceps: 9, core: 3 },
  }),
  buildTemplate('beginner_full_body_gym', {
    audience: 'beginner, gym',
    daysPerWeek: 3,
    equipmentProfile: 'mixed',
    muscleVolumes: { chest: 6, back: 6, quadriceps: 6, core: 6 },
  }),
  buildTemplate('beginner_upper_lower_gym', {
    audience: 'beginner, gym',
    daysPerWeek: 4,
    equipmentProfile: 'mixed',
    estimatedSessionMinutes: 75,
    muscleVolumes: { chest: 12, back: 12, quadriceps: 10, biceps: 4 },
  }),
  buildTemplate('home_bodyweight_3day', {
    audience: 'beginner, home',
    daysPerWeek: 3,
    equipmentProfile: 'bodyweight',
    estimatedSessionMinutes: 45,
    muscleVolumes: { chest: 6, core: 6, quadriceps: 6, glutes: 6 },
  }),
];

describe('recommendTemplateSlug', () => {
  it('prefers machine template for beginner gym users with exact days', () => {
    const slug = recommendTemplateSlug(
      {
        trainingLevel: 'beginner',
        trainingEnvironment: 'gym',
        trainingDaysPerWeek: 3,
        preferredSessionMinutes: 60,
        preferredMuscleGroups: ['chest', 'back'],
      },
      templates,
    );
    expect(slug).toBe('beginner_machine_gym_3day');
  });

  it('prefers home bodyweight for home users', () => {
    const slug = recommendTemplateSlug(
      {
        trainingLevel: 'beginner',
        trainingEnvironment: 'home',
        trainingDaysPerWeek: 3,
        preferredSessionMinutes: 45,
        preferredMuscleGroups: ['core'],
      },
      templates,
    );
    expect(slug).toBe('home_bodyweight_3day');
  });

  it('matches four-day templates when athlete trains four days', () => {
    const slug = recommendTemplateSlug(
      {
        trainingLevel: 'beginner',
        trainingEnvironment: 'gym',
        trainingDaysPerWeek: 4,
        preferredSessionMinutes: 75,
        preferredMuscleGroups: ['chest', 'back'],
      },
      templates,
    );
    expect(slug).toBe('beginner_upper_lower_gym');
  });
});

describe('rankTemplates', () => {
  it('ranks chest-focused templates higher for chest preference', () => {
    const ranked = rankTemplates(
      {
        trainingLevel: 'beginner',
        trainingEnvironment: 'gym',
        trainingDaysPerWeek: 3,
        preferredSessionMinutes: 60,
        preferredMuscleGroups: ['chest'] as MuscleGroup[],
      },
      templates.filter((template) => template.audience.includes('gym') && template.daysPerWeek === 3),
    );

    expect(ranked[0]?.template.slug).toBe('beginner_machine_gym_3day');
  });
});
