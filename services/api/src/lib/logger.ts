import pino from 'pino';

import type { Env } from '../config/env.js';

export type Logger = pino.Logger;

/**
 * Create a structured logger for the API service.
 *
 * @param env - Validated environment (log level).
 * @returns Pino logger instance.
 */
export function createLogger(env: Env): Logger {
  return pino({ level: env.LOG_LEVEL });
}
