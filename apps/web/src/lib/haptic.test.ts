import { afterEach, describe, expect, it, vi } from 'vitest';

import { getHapticDuration, triggerHaptic } from './haptic';

describe('haptic', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns configured durations', () => {
    expect(getHapticDuration('light')).toBe(12);
    expect(getHapticDuration('success')).toEqual([12, 40, 12]);
  });

  it('calls navigator.vibrate when available', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });

    triggerHaptic('medium');

    expect(vibrate).toHaveBeenCalledWith(24);
  });

  it('does not throw when vibration is unavailable', () => {
    vi.stubGlobal('navigator', {});

    expect(() => {
      triggerHaptic('light');
    }).not.toThrow();
  });
});
