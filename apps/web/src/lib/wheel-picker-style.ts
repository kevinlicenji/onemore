export interface WheelItemStyle {
  scale: number;
  opacity: number;
  fontSizeRem: number;
  fontWeight: number;
}

export type WheelPickerSize = 'default' | 'workout';

/**
 * Visual style for a wheel item based on distance from the scroll center.
 * `size` controls the base font size scaling (workout = larger).
 */
export function getWheelItemStyle(
  distanceFromCenter: number,
  size?: WheelPickerSize,
): WheelItemStyle {
  const distance = Math.abs(distanceFromCenter);
  const large = size === 'workout';
  return {
    scale: Math.max(0.65, 1.12 - distance * 0.18),
    opacity: Math.max(0.18, 1 - distance * 0.38),
    fontSizeRem:
      distance < 0.35
        ? large
          ? 2.0
          : 1.65
        : distance < 1.2
          ? large
            ? 1.25
            : 1.05
          : large
            ? 0.95
            : 0.82,
    fontWeight: distance < 0.35 ? 700 : distance < 1.2 ? 500 : 400,
  };
}
