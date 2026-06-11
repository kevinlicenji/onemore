import { describe, expect, it } from 'vitest';

import { historyListQuerySchema } from './history.js';

describe('historyListQuerySchema', () => {
  it('defaults limit to 20', () => {
    const result = historyListQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it('accepts date filters', () => {
    const result = historyListQuerySchema.parse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-06-01T00:00:00.000Z',
      limit: '10',
    });
    expect(result.limit).toBe(10);
    expect(result.from).toBeDefined();
  });
});
