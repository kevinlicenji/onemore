import type { TemplateSummary } from '@onemore/shared';
import { describe, expect, it } from 'vitest';

import { recommendTemplateSlug } from './recommend-template';

const templates: TemplateSummary[] = [
  {
    slug: 'beginner_machine_gym_3day',
    name: 'Beginner Machines',
    description: null,
    guide: null,
    objective: 'fitness',
    daysPerWeek: 3,
    audience: 'beginner, gym',
    equipmentProfile: 'machines',
    split: 'full_body',
  },
  {
    slug: 'beginner_full_body_gym',
    name: 'Beginner Full Body',
    description: null,
    guide: null,
    objective: 'fitness',
    daysPerWeek: 3,
    audience: 'beginner, gym',
    equipmentProfile: 'mixed',
    split: 'full_body',
  },
  {
    slug: 'home_bodyweight_3day',
    name: 'Home Bodyweight',
    description: null,
    guide: null,
    objective: 'fitness',
    daysPerWeek: 3,
    audience: 'beginner, home',
    equipmentProfile: 'bodyweight',
    split: 'full_body',
  },
];

describe('recommendTemplateSlug', () => {
  it('prefers machine template for beginner gym users', () => {
    const slug = recommendTemplateSlug(
      { trainingLevel: 'beginner', trainingEnvironment: 'gym', trainingDaysPerWeek: 3 },
      templates,
    );
    expect(slug).toBe('beginner_machine_gym_3day');
  });

  it('prefers home bodyweight for home users', () => {
    const slug = recommendTemplateSlug(
      { trainingLevel: 'beginner', trainingEnvironment: 'home', trainingDaysPerWeek: 3 },
      templates,
    );
    expect(slug).toBe('home_bodyweight_3day');
  });
});
