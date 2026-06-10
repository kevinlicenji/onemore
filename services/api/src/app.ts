import { API_VERSION_PREFIX } from '@onemore/shared';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import type { Env } from './config/env.js';
import type { Logger } from './lib/logger.js';
import { createErrorHandler } from './middleware/error-handler.js';
import { createHealthRouter } from './routes/health.js';
import { createV1Router } from './routes/v1.js';

/**
 * Build the Express application with middleware and routes.
 *
 * @param env - Validated environment.
 * @param logger - Structured logger.
 * @returns Configured Express app (not listening).
 */
export function createApp(env: Env, logger: Logger): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: '1mb' }));

  app.use(createHealthRouter(env));
  app.use(API_VERSION_PREFIX, createV1Router());

  app.use(createErrorHandler(logger));

  return app;
}
