import { describe, expect, it } from 'vitest';

import {
  flattenMuscleFocusSelections,
  ONBOARDING_MUSCLE_FOCUS_OPTIONS,
} from '../constants/onboarding-muscle-focus.js';

describe('flattenMuscleFocusSelections', () => {
  it('maps visual cards to stored muscle tags', () => {
    expect(flattenMuscleFocusSelections(['arms', 'core'])).toEqual(['biceps', 'triceps', 'core']);
  });

  it('includes full_body when balanced is selected', () => {
    expect(flattenMuscleFocusSelections(['balanced'])).toEqual(['full_body']);
  });

  it('covers every onboarding option', () => {
    expect(ONBOARDING_MUSCLE_FOCUS_OPTIONS).toHaveLength(8);
  });
});
