import { describe, expect, it } from 'vitest';

import { shouldHideShell } from './shell-routes';

describe('shouldHideShell', () => {
  it('hides shell on landing', () => {
    expect(shouldHideShell('')).toBe(true);
  });

  it('hides shell on auth routes', () => {
    expect(shouldHideShell('login')).toBe(true);
    expect(shouldHideShell('register')).toBe(true);
    expect(shouldHideShell('forgot-password')).toBe(true);
  });

  it('hides shell on onboarding and offline', () => {
    expect(shouldHideShell('onboarding')).toBe(true);
    expect(shouldHideShell('onboarding/choose-program')).toBe(true);
    expect(shouldHideShell('offline')).toBe(true);
  });

  it('hides shell on active workout but not start', () => {
    expect(shouldHideShell('workouts/start')).toBe(false);
    expect(shouldHideShell('workouts/abc-123')).toBe(true);
  });

  it('shows shell on main app routes', () => {
    expect(shouldHideShell('dashboard')).toBe(false);
    expect(shouldHideShell('programs')).toBe(false);
    expect(shouldHideShell('settings')).toBe(false);
  });
});
