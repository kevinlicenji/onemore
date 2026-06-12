import { describe, expect, it } from 'vitest';

/**
 * Parsing helper mirrored from SetMetricInput onChange behavior.
 */
function parseMetricInput(
  raw: string,
  min: number,
  max: number,
): number | null {
  if (raw === '') {
    return null;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.min(max, Math.max(min, parsed));
}

describe('SetMetricInput parsing', () => {
  it('returns null for empty input', () => {
    expect(parseMetricInput('', 0, 500)).toBeNull();
  });

  it('clamps values to min and max', () => {
    expect(parseMetricInput('40', 0, 500)).toBe(40);
    expect(parseMetricInput('-5', 0, 500)).toBe(0);
    expect(parseMetricInput('999', 0, 500)).toBe(500);
  });
});
