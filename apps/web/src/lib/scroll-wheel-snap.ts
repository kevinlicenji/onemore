/**
 * Rounds a scroll offset to the nearest wheel item index.
 */
export function snapIndexFromScroll(scrollTop: number, itemHeight: number): number {
  if (itemHeight <= 0) {
    return 0;
  }
  return Math.round(scrollTop / itemHeight);
}

/**
 * Scroll offset for a wheel item index.
 */
export function scrollTopForIndex(index: number, itemHeight: number): number {
  return index * itemHeight;
}

/**
 * Clamps an index inside wheel bounds.
 */
export function clampWheelIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }
  return Math.min(itemCount - 1, Math.max(0, index));
}

/**
 * Builds evenly spaced numeric wheel values.
 */
export function buildNumericWheelValues(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  const decimals = step % 1 === 0 ? 0 : 1;
  for (let value = min; value <= max + Number.EPSILON; value += step) {
    const rounded = Number(value.toFixed(decimals));
    values.push(rounded);
  }
  return values;
}
