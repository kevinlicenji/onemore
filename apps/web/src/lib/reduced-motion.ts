export const REDUCED_MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

/**
 * Reads the current prefers-reduced-motion setting from the browser.
 */
export function prefersReducedMotion(): boolean {
  if (typeof globalThis.matchMedia !== 'function') {
    return false;
  }
  return globalThis.matchMedia(REDUCED_MOTION_MEDIA).matches;
}
