import { describe, expect, it } from 'vitest';

import type { TemplateSummary } from '@onemore/shared';

import { templateCardTagline, templateCardTitle } from './template-card-copy';

const template: TemplateSummary = {
  slug: 'beginner_full_body_gym',
  name: 'Beginner Full Body',
  description: 'Full body principiante',
  guide: {
    en: 'Three full-body sessions per week repeat the main movement patterns without long gym stays.',
    it: 'Tre sessioni full body a settimana ripetono i pattern fondamentali.',
  },
  tagline: {
    en: 'Three days, full body. Start strong.',
    it: 'Tre giorni, tutto il corpo. Parti forte.',
  },
  objective: 'fitness',
  daysPerWeek: 3,
  audience: 'beginner, gym',
  equipmentProfile: 'mixed',
  split: 'full_body',
  estimatedSessionMinutes: 55,
  difficultyLevel: 1,
  muscleVolumes: {},
};

describe('template-card-copy', () => {
  it('picks localized titles', () => {
    expect(templateCardTitle(template, 'it')).toBe('Full body principiante');
    expect(templateCardTitle(template, 'en')).toBe('Beginner Full Body');
  });

  it('prefers tagline over guide excerpt', () => {
    expect(templateCardTagline(template, 'it')).toBe('Tre giorni, tutto il corpo. Parti forte.');
  });
});
