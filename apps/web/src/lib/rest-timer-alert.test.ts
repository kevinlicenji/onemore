import { afterEach, describe, expect, it, vi } from 'vitest';

import { playRestCompleteChime } from './rest-timer-alert';

describe('playRestCompleteChime', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not throw when AudioContext is unavailable', () => {
    vi.stubGlobal('window', {
      AudioContext: undefined,
      webkitAudioContext: undefined,
    });
    expect(() => {
      playRestCompleteChime();
    }).not.toThrow();
  });
});
