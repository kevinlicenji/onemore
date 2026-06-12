import { describe, expect, it } from 'vitest';

import { buildHistoryDateRange } from './history-filters';

describe('buildHistoryDateRange', () => {
  it('returns empty range for all preset', () => {
    expect(buildHistoryDateRange('all')).toEqual({});
  });

  it('returns bounded range for 7d preset', () => {
    const range = buildHistoryDateRange('7d');
    expect(range.from).toBeDefined();
    expect(range.to).toBeDefined();
  });

  it('parses custom local dates', () => {
    const range = buildHistoryDateRange('custom', '2026-06-01', '2026-06-10');
    expect(range.from).toContain('2026-06-01');
    expect(range.to).toContain('2026-06-10');
  });
});
