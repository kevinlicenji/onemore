import type { TemplateSummary } from '@onemore/shared';
import { describe, expect, it } from 'vitest';

import { recommendTemplateSlug } from './recommend-template';

const templates: TemplateSummary[] = [
  {
    slug: 'beginner_full_body_gym',
    name: 'Full body',
    description: null,
    objective: 'fitness',
    daysPerWeek: 3,
    audience: 'beginner, gym',
  },
  {
    slug: 'beginner_upper_lower_gym',
    name: 'Upper lower',
    description: null,
    objective: 'fitness',
    daysPerWeek: 4,
    audience: 'beginner, gym',
  },
  {
    slug: 'home_bodyweight_3day',
    name: 'Home',
    description: null,
    objective: 'fitness',
    daysPerWeek: 3,
    audience: 'beginner, home',
  },
];

describe('recommendTemplateSlug', () => {
  it('prefers home template for home environment', () => {
    expect(
      recommendTemplateSlug(
        { trainingLevel: 'beginner', trainingEnvironment: 'home', trainingDaysPerWeek: 3 },
        templates,
      ),
    ).toBe('home_bodyweight_3day');
  });

  it('matches gym days per week', () => {
    expect(
      recommendTemplateSlug(
        { trainingLevel: 'beginner', trainingEnvironment: 'gym', trainingDaysPerWeek: 4 },
        templates,
      ),
    ).toBe('beginner_upper_lower_gym');
  });

  it('returns null for empty catalog', () => {
    expect(recommendTemplateSlug({ trainingEnvironment: 'gym' }, [])).toBeNull();
  });
});
