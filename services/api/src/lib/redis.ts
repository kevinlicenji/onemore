import { Redis } from 'ioredis';

import type { Env } from '../config/env.js';

export type RedisClient = Redis;

/**
 * Create Redis client when REDIS_URL is configured.
 *
 * @param env - Application environment.
 * @returns Redis client or null when URL is missing.
 */
export function createRedisClient(env: Env): RedisClient | null {
  if (!env.REDIS_URL) {
    return null;
  }
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
}
