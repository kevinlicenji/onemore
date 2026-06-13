import { describe, expect, it } from 'vitest';

import { defaultWorkoutDayLabel, localizeWorkoutDayLabel } from './workout-day-label';

describe('workout-day-label', () => {
  it('builds default labels per locale', () => {
    expect(defaultWorkoutDayLabel(0, 'it')).toBe('Giorno 1');
    expect(defaultWorkoutDayLabel(2, 'en')).toBe('Day 3');
  });

  it('localizes numbered labels', () => {
    expect(localizeWorkoutDayLabel('Giorno 2', 'en')).toBe('Day 2');
    expect(localizeWorkoutDayLabel('Day 4', 'it')).toBe('Giorno 4');
  });

  it('normalizes legacy letter and split labels', () => {
    expect(localizeWorkoutDayLabel('Day A', 'it')).toBe('Giorno 1');
    expect(localizeWorkoutDayLabel('Day B', 'en')).toBe('Day 2');
    expect(localizeWorkoutDayLabel('Upper A', 'it')).toBe('Giorno 1');
    expect(localizeWorkoutDayLabel('Lower B', 'en')).toBe('Day 4');
    expect(localizeWorkoutDayLabel('Push', 'it')).toBe('Giorno 1');
    expect(localizeWorkoutDayLabel('Legs', 'en')).toBe('Day 3');
  });

  it('keeps custom labels unchanged', () => {
    expect(localizeWorkoutDayLabel('Petto + tricipiti', 'it')).toBe('Petto + tricipiti');
  });
});
