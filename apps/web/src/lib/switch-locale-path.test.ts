import { describe, expect, it } from 'vitest';

import { switchLocalePath } from './switch-locale-path';

describe('switchLocalePath', () => {
  it('replaces locale segment in nested routes', () => {
    expect(switchLocalePath('/it/workouts/start', 'en')).toBe('/en/workouts/start');
  });

  it('returns locale root when pathname is empty', () => {
    expect(switchLocalePath('/', 'it')).toBe('/it');
  });

  it('prefixes locale when pathname has no locale segment', () => {
    expect(switchLocalePath('/dashboard', 'en')).toBe('/en/dashboard');
  });
});
