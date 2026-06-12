import { describe, expect, it, vi } from 'vitest';

const { redisCtor } = vi.hoisted(() => ({
  redisCtor: vi.fn(function RedisMock(this: { status: string }, _url: string, _options: unknown) {
    this.status = 'wait';
  }),
}));

vi.mock('ioredis', () => ({
  Redis: redisCtor,
}));

import type { Env } from '../config/env.js';
import { createRedisClient, REDIS_CLIENT_OPTIONS } from './redis.js';

describe('createRedisClient', () => {
  it('returns null when REDIS_URL is unset', () => {
    expect(createRedisClient({ REDIS_URL: undefined } as Env)).toBeNull();
  });

  it('uses BullMQ-compatible ioredis options', () => {
    createRedisClient({ REDIS_URL: 'redis://localhost:6380' } as Env);

    expect(REDIS_CLIENT_OPTIONS.maxRetriesPerRequest).toBeNull();
    expect(redisCtor).toHaveBeenCalledWith('redis://localhost:6380', REDIS_CLIENT_OPTIONS);
  });
});
