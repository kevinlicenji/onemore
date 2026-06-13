export interface WheelItemStyle {
  scale: number;
  opacity: number;
  fontSizeRem: number;
  fontWeight: number;
}

const COMPACT_FONT_SCALE = 0.82;

/**
 * Visual style for a wheel item based on distance from the scroll center.
 */
export function getWheelItemStyle(
  distanceFromCenter: number,
  size: 'default' | 'compact' = 'default',
): WheelItemStyle {
  const distance = Math.abs(distanceFromCenter);
  const base = {
    scale: Math.max(0.65, 1.12 - distance * 0.18),
    opacity: Math.max(0.18, 1 - distance * 0.38),
    fontSizeRem: distance < 0.35 ? 1.65 : distance < 1.2 ? 1.05 : 0.82,
    fontWeight: distance < 0.35 ? 700 : distance < 1.2 ? 500 : 400,
  };

  if (size !== 'compact') {
    return base;
  }

  return {
    ...base,
    fontSizeRem: base.fontSizeRem * COMPACT_FONT_SCALE,
  };
}
