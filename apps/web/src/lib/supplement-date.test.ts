import { describe, expect, it } from 'vitest';

import {
  getTodayDateKey,
  supplementLogIsoForDateKey,
  supplementLogRangeForDateKey,
} from './supplement-date';

describe('supplement-date', () => {
  it('builds log range from date key', () => {
    expect(supplementLogRangeForDateKey('2026-06-15')).toEqual({
      from: '2026-06-15T00:00:00.000Z',
      to: '2026-06-15T23:59:59.999Z',
    });
  });

  it('stores logs at UTC midnight for the local day key', () => {
    expect(supplementLogIsoForDateKey('2026-06-15')).toBe('2026-06-15T00:00:00.000Z');
  });

  it('returns a valid today key for Europe/Rome', () => {
    expect(getTodayDateKey('Europe/Rome')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
