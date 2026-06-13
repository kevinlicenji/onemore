import { describe, expect, it } from 'vitest';

import { buildOnboardingPatch } from './onboarding-patch.js';

describe('buildOnboardingPatch', () => {
  it('includes only defined fields', () => {
    expect(buildOnboardingPatch({ preferredSessionMinutes: 60 })).toEqual({
      preferredSessionMinutes: 60,
    });
  });

  it('passes muscle groups when provided', () => {
    expect(buildOnboardingPatch({ preferredMuscleGroups: ['chest', 'back'] })).toEqual({
      preferredMuscleGroups: ['chest', 'back'],
    });
  });
});
