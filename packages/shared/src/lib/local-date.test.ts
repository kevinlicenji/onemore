import { describe, expect, it } from 'vitest';

import { getLocalDateKey } from './iso-week.js';
import { localDateKeyToUtcEnd, localDateKeyToUtcStart } from './local-date.js';

describe('local-date helpers', () => {
  it('maps date keys to UTC day bounds', () => {
    expect(localDateKeyToUtcStart('2026-06-15')).toBe('2026-06-15T00:00:00.000Z');
    expect(localDateKeyToUtcEnd('2026-06-15')).toBe('2026-06-15T23:59:59.999Z');
  });

  it('formats local date keys in a timezone', () => {
    const key = getLocalDateKey(new Date('2026-06-15T22:00:00.000Z'), 'Europe/Rome');
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
