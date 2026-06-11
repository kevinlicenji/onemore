import { describe, expect, it } from 'vitest';

import { DEFAULT_USER_SETTINGS, userSettingsSchema } from './settings.js';

describe('userSettingsSchema', () => {
  it('applies defaults for empty object', () => {
    const settings = userSettingsSchema.parse({});
    expect(settings.units).toBe('metric');
    expect(settings.notifications.workoutReminders).toBe(true);
  });

  it('matches DEFAULT_USER_SETTINGS', () => {
    expect(DEFAULT_USER_SETTINGS.notifications.prCelebrations).toBe(true);
  });
});
