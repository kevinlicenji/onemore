import { describe, expect, it } from 'vitest';

import { isSwipeInteractiveTarget, resolveSwipeDirection } from './horizontal-swipe';

describe('horizontal-swipe', () => {
  it('resolves left and right swipes', () => {
    expect(resolveSwipeDirection({ deltaX: -80, deltaY: 10 })).toBe('left');
    expect(resolveSwipeDirection({ deltaX: 90, deltaY: -5 })).toBe('right');
  });

  it('ignores short or mostly vertical gestures', () => {
    expect(resolveSwipeDirection({ deltaX: -40, deltaY: 5 })).toBeNull();
    expect(resolveSwipeDirection({ deltaX: -120, deltaY: 80 })).toBeNull();
  });

  it('detects interactive swipe targets', () => {
    const button = {
      closest: (selector: string) => (selector.includes('button') ? button : null),
    };
    const panel = {
      closest: () => null,
    };

    expect(isSwipeInteractiveTarget(button as unknown as EventTarget)).toBe(true);
    expect(isSwipeInteractiveTarget(panel as unknown as EventTarget)).toBe(false);
  });
});
