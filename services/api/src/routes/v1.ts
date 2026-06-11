import { Router } from 'express';

import type { Env } from '../config/env.js';
import type { RedisClient } from '../lib/redis.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import { OAuthService } from '../modules/auth/oauth.service.js';
import type { UsersService } from '../modules/users/users.service.js';
import { createAuthenticateMiddleware } from '../middleware/authenticate.js';
import { createAuthRouter } from './auth.routes.js';
import { createUsersRouter } from './users.routes.js';

export interface V1RouterDeps {
  env: Env;
  authService: AuthService;
  usersService: UsersService;
  redis: RedisClient | null;
}

/**
 * API v1 route aggregator.
 */
export function createV1Router(deps: V1RouterDeps): Router {
  const router = Router();
  const oauthService = new OAuthService(deps.env);
  const authenticate = createAuthenticateMiddleware(deps.authService);

  router.get('/', (_req, res) => {
    res.json({ message: 'OneMore API v1' });
  });

  router.use(
    '/auth',
    createAuthRouter({
      env: deps.env,
      authService: deps.authService,
      oauthService,
      redis: deps.redis,
    }),
  );

  router.use('/users', authenticate, createUsersRouter(deps.usersService));

  return router;
}
