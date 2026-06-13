import { describe, expect, it } from 'vitest';

import { findDropIndexFromPointerY, type ExerciseRowBounds } from './exercise-drag-overlay';

const sampleBounds: ExerciseRowBounds[] = [
  { index: 0, top: 0, bottom: 60, height: 60 },
  { index: 1, top: 72, bottom: 132, height: 60 },
  { index: 2, top: 144, bottom: 204, height: 60 },
];

describe('findDropIndexFromPointerY', () => {
  it('returns the first row when the pointer is above the first midpoint', () => {
    expect(findDropIndexFromPointerY(sampleBounds, 10, 3)).toBe(0);
  });

  it('returns the second row when the pointer is between first and second midpoints', () => {
    expect(findDropIndexFromPointerY(sampleBounds, 80, 3)).toBe(1);
  });

  it('returns the last row when the pointer is below all midpoints', () => {
    expect(findDropIndexFromPointerY(sampleBounds, 250, 3)).toBe(2);
  });
});
