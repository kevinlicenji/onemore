export type HapticPattern = 'light' | 'medium' | 'success';

const HAPTIC_DURATIONS: Record<HapticPattern, number | number[]> = {
  light: 12,
  medium: 24,
  success: [12, 40, 12],
};

/**
 * Triggers a short vibration when the device supports the Vibration API.
 */
export function triggerHaptic(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    navigator.vibrate(HAPTIC_DURATIONS[pattern]);
  } catch {
    // Vibration may be blocked by browser policy or unsupported hardware.
  }
}

/**
 * @returns The vibration duration(s) for a haptic pattern.
 */
export function getHapticDuration(pattern: HapticPattern): number | number[] {
  return HAPTIC_DURATIONS[pattern];
}
