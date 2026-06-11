import { API_VERSION_PREFIX } from '@onemore/shared';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import type { Env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { createRedisClient, type RedisClient } from './lib/redis.js';
import type { Logger } from './lib/logger.js';
import { createErrorHandler } from './middleware/error-handler.js';
import { AuthService } from './modules/auth/auth.service.js';
import { UsersService } from './modules/users/users.service.js';
import { createHealthRouter } from './routes/health.js';
import { createV1Router } from './routes/v1.js';

export interface AppDeps {
  authService?: AuthService;
  usersService?: UsersService;
  redis?: RedisClient | null;
}

/**
 * Build the Express application with middleware and routes.
 */
export function createApp(env: Env, logger: Logger, deps?: AppDeps): express.Application {
  const app = express();
  const redis = deps?.redis ?? createRedisClient(env);
  const authService = deps?.authService ?? new AuthService(prisma, env, logger);
  const usersService = deps?.usersService ?? new UsersService(prisma);

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: [env.WEB_APP_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.use(createHealthRouter(env));
  app.use(API_VERSION_PREFIX, createV1Router({ env, authService, usersService, redis }));

  app.use(createErrorHandler(logger));

  return app;
}
