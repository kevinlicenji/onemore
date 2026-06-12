/** Minimum downward drag (px) before a sheet closes. */
export const SHEET_DISMISS_THRESHOLD = 72;

/**
 * @param rawDeltaY - Downward finger movement in pixels.
 * @returns Non-negative drag offset for the sheet transform.
 */
export function calculateSheetDragOffset(rawDeltaY: number): number {
  if (rawDeltaY <= 0) {
    return 0;
  }
  return rawDeltaY;
}

/**
 * @param offsetY - Current downward drag offset.
 * @param threshold - Release threshold for dismiss.
 * @returns Whether the sheet should close on release.
 */
export function shouldDismissSheet(
  offsetY: number,
  threshold: number = SHEET_DISMISS_THRESHOLD,
): boolean {
  return offsetY >= threshold;
}
