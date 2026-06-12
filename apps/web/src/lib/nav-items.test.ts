import { describe, expect, it } from 'vitest';

import {
  buildGymMoreNavItems,
  buildGymPrimaryNavItems,
  isGymMoreRouteActive,
} from './nav-items';

describe('gym navigation', () => {
  it('builds four primary tabs plus prominent workout', () => {
    const items = buildGymPrimaryNavItems('it');
    expect(items).toHaveLength(4);
    expect(items.find((item) => item.prominent)?.labelKey).toBe('navWorkout');
  });

  it('exposes exercises and settings in the more menu', () => {
    const items = buildGymMoreNavItems('it');
    expect(items.map((item) => item.labelKey)).toEqual(['navExercises', 'navSettings']);
  });

  it('detects more-menu routes', () => {
    expect(isGymMoreRouteActive('exercises')).toBe(true);
    expect(isGymMoreRouteActive('settings')).toBe(true);
    expect(isGymMoreRouteActive('dashboard')).toBe(false);
  });
});
