import { describe, expect, it } from 'vitest';

import { resolveAuthenticatedHomePath } from './api-auth.js';

describe('resolveAuthenticatedHomePath', () => {
  it('routes incomplete users to onboarding', () => {
    expect(
      resolveAuthenticatedHomePath('it', {
        onboardingCompletedAt: null,
      } as never),
    ).toBe('/it/onboarding');
  });

  it('routes completed users to dashboard', () => {
    expect(
      resolveAuthenticatedHomePath('en', {
        onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
      } as never),
    ).toBe('/en/dashboard');
  });
});
