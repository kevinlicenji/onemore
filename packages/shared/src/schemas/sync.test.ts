import { describe, expect, it } from 'vitest';

import { syncBatchRequestSchema, syncMutationSchema } from './sync.js';

describe('sync schemas', () => {
  it('accepts a workout session mutation', () => {
    const result = syncMutationSchema.safeParse({
      type: 'workout_session',
      op: 'upsert',
      payload: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'in_progress',
        sessionType: 'free',
        startedAt: '2026-06-10T10:00:00.000Z',
        clientUpdatedAt: '2026-06-10T10:00:00.000Z',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects batches over 500 mutations', () => {
    const mutations = Array.from({ length: 501 }, () => ({
      type: 'set_log' as const,
      op: 'upsert' as const,
      payload: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        exerciseExecutionId: '550e8400-e29b-41d4-a716-446655440001',
        setNumber: 1,
        clientTimestamp: '2026-06-10T10:00:00.000Z',
      },
    }));
    const result = syncBatchRequestSchema.safeParse({
      clientSyncId: '550e8400-e29b-41d4-a716-446655440099',
      mutations,
    });
    expect(result.success).toBe(false);
  });
});
