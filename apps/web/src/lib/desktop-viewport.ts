export const DESKTOP_MIN_WIDTH_PX = 1024;

export const DESKTOP_MEDIA = `(min-width: ${String(DESKTOP_MIN_WIDTH_PX)}px)`;

/**
 * @param mediaMatches - Result of `window.matchMedia(DESKTOP_MEDIA).matches`.
 */
export function isDesktopViewport(mediaMatches: boolean): boolean {
  return mediaMatches;
}
