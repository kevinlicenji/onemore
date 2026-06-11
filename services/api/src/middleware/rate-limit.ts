import type { NextFunction, Request, Response } from 'express';
import type { RedisClient } from '../lib/redis.js';

import { HttpError } from '../lib/errors.js';

/**
 * Redis sliding-window rate limiter for login attempts (5 / 15 min / IP).
 *
 * @param redis - Redis client; skips limiting when null (local dev without Redis).
 * @param keyPrefix - Redis key prefix.
 * @param limit - Max attempts in window.
 * @param windowSeconds - Window duration in seconds.
 */
export function createRateLimiter(
  redis: RedisClient | null,
  keyPrefix: string,
  limit: number,
  windowSeconds: number,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!redis) {
      next();
      return;
    }

    try {
      if (redis.status !== 'ready') {
        await redis.connect();
      }
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const key = `${keyPrefix}:${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (count > limit) {
        next(new HttpError(429, 'Too many requests', 'RATE_LIMITED'));
        return;
      }
      next();
    } catch {
      next();
    }
  };
}
