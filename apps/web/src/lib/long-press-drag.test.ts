import { describe, expect, it } from 'vitest';

import {
  findExerciseRowIndexFromPoint,
  LONG_PRESS_MOVE_CANCEL_PX,
  shouldCancelLongPress,
} from './long-press-drag';

describe('shouldCancelLongPress', () => {
  it('does not cancel for small movement', () => {
    expect(shouldCancelLongPress(3, 4, LONG_PRESS_MOVE_CANCEL_PX)).toBe(false);
  });

  it('cancels when movement exceeds threshold', () => {
    expect(shouldCancelLongPress(8, 8, LONG_PRESS_MOVE_CANCEL_PX)).toBe(true);
  });
});

describe('findExerciseRowIndexFromPoint', () => {
  it('returns null when document is unavailable', () => {
    expect(findExerciseRowIndexFromPoint(100, 100)).toBeNull();
  });
});
