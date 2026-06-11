import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  identifyUser,
  setPostHogClient,
  trackEvent,
  trackOnboardingCompleted,
  trackOnboardingStepCompleted,
} from './analytics.js';

describe('analytics', () => {
  beforeEach(() => {
    setPostHogClient(null);
  });

  it('does not throw when PostHog is disabled', () => {
    expect(() => {
      trackEvent('onboarding_step_completed', { step_id: 'goal', step_index: 0 });
      identifyUser('user-1');
      trackOnboardingStepCompleted('goal', 0);
      trackOnboardingCompleted(2, 'mass', 'beginner');
    }).not.toThrow();
  });

  it('captures events when PostHog client is set', () => {
    const capture = vi.fn();
    const identify = vi.fn();
    setPostHogClient({ capture, identify } as never);

    identifyUser('user-1');
    trackOnboardingStepCompleted('goal', 0);
    trackOnboardingCompleted(2, 'mass', 'beginner');

    expect(identify).toHaveBeenCalledWith('user-1');
    expect(capture).toHaveBeenCalledWith('onboarding_step_completed', {
      step_id: 'goal',
      step_index: 0,
    });
    expect(capture).toHaveBeenCalledWith('onboarding_completed', {
      motivation_level: 2,
      goal: 'mass',
      level: 'beginner',
    });
  });
});
