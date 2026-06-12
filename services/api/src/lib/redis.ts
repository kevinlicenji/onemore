import { Redis } from 'ioredis';

import type { Env } from '../config/env.js';

export type RedisClient = Redis;

/** ioredis options required by BullMQ blocking workers. */
export const REDIS_CLIENT_OPTIONS = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
} as const;

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
  return new Redis(env.REDIS_URL, REDIS_CLIENT_OPTIONS);
}
