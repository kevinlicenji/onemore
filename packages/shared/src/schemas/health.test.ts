import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from './health.js';

describe('healthResponseSchema', () => {
  it('accepts a valid health response', () => {
    const payload = {
      status: 'ok',
      timestamp: '2026-06-10T12:00:00.000Z',
      version: '0.1.0',
    };

    expect(healthResponseSchema.parse(payload)).toEqual(payload);
  });

  it('rejects invalid status', () => {
    expect(() =>
      healthResponseSchema.parse({
        status: 'down',
        timestamp: '2026-06-10T12:00:00.000Z',
        version: '0.1.0',
      }),
    ).toThrow();
  });
});
