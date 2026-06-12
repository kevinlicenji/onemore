import {
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from '@onemore/shared';
import type { CookieOptions, Response } from 'express';
import { Router } from 'express';

import type { Env } from '../config/env.js';
import type { RedisClient } from '../lib/redis.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { createRateLimiter } from '../middleware/rate-limit.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import { hashIp } from '../modules/auth/oauth.service.js';
import type { OAuthService } from '../modules/auth/oauth.service.js';

interface AuthRouterDeps {
  env: Env;
  authService: AuthService;
  oauthService: OAuthService;
  redis: RedisClient | null;
}

function refreshCookieOptions(env: Env): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res: Response, env: Env, token: string): void {
  res.cookie(env.REFRESH_COOKIE_NAME, token, refreshCookieOptions(env));
}

function clearRefreshCookie(res: Response, env: Env): void {
  res.clearCookie(env.REFRESH_COOKIE_NAME, {
    path: '/api/v1/auth/refresh',
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

function authResponse(
  res: Response,
  env: Env,
  result: Awaited<ReturnType<AuthService['register']>>,
) {
  setRefreshCookie(res, env, result.refreshToken);
  res.json({
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    user: result.user,
  });
}

/**
 * Authentication routes under /api/v1/auth.
 */
export function createAuthRouter(deps: AuthRouterDeps): Router {
  const router = Router();
  const loginRateLimit = createRateLimiter(deps.redis, 'ratelimit:login', 5, 900);

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const body = registerBodySchema.parse(req.body);
      const ipHash = hashIp(req.ip ?? 'unknown');
      const result = await deps.authService.register(body, ipHash);
      authResponse(res, deps.env, result);
    }),
  );

  router.post(
    '/login',
    loginRateLimit,
    asyncHandler(async (req, res) => {
      const payload = req.body as { identifier?: string; email?: string; password?: string };
      const body = loginBodySchema.parse({
        identifier: payload.identifier ?? payload.email,
        password: payload.password,
      });
      const ipHash = hashIp(req.ip ?? 'unknown');
      const result = await deps.authService.login(body, ipHash);
      authResponse(res, deps.env, result);
    }),
  );

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const token = req.cookies[deps.env.REFRESH_COOKIE_NAME] as string | undefined;
      await deps.authService.logout(token, hashIp(req.ip ?? 'unknown'));
      clearRefreshCookie(res, deps.env);
      res.status(204).send();
    }),
  );

  router.post(
    '/refresh',
    asyncHandler(async (req, res) => {
      const token = req.cookies[deps.env.REFRESH_COOKIE_NAME] as string | undefined;
      if (!token) {
        res.status(401).json({ error: { message: 'Missing refresh token', code: 'UNAUTHORIZED' } });
        return;
      }
      const result = await deps.authService.refresh(token, hashIp(req.ip ?? 'unknown'));
      authResponse(res, deps.env, result);
    }),
  );

  router.post(
    '/forgot-password',
    asyncHandler(async (req, res) => {
      const body = forgotPasswordBodySchema.parse(req.body);
      await deps.authService.forgotPassword(body.email, hashIp(req.ip ?? 'unknown'));
      res.status(204).send();
    }),
  );

  router.post(
    '/reset-password',
    asyncHandler(async (req, res) => {
      const body = resetPasswordBodySchema.parse(req.body);
      await deps.authService.resetPassword(body.token, body.password, hashIp(req.ip ?? 'unknown'));
      res.status(204).send();
    }),
  );

  router.get(
    '/oauth/:provider',
    asyncHandler((req, res) => {
      const provider = req.params.provider;
      if (provider !== 'google' && provider !== 'apple') {
        res.status(400).json({ error: { message: 'Invalid provider', code: 'INVALID_PROVIDER' } });
        return Promise.resolve();
      }
      const { url, state, codeVerifier } = deps.oauthService.start(provider);
      res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 600_000 });
      res.cookie('oauth_provider', provider, { httpOnly: true, sameSite: 'lax', maxAge: 600_000 });
      if (codeVerifier) {
        res.cookie('oauth_verifier', codeVerifier, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 600_000,
        });
      }
      res.redirect(url);
      return Promise.resolve();
    }),
  );

  router.get(
    '/oauth/:provider/callback',
    asyncHandler(async (req, res) => {
      const provider = req.params.provider;
      if (provider !== 'google' && provider !== 'apple') {
        res.status(400).json({ error: { message: 'Invalid provider', code: 'INVALID_PROVIDER' } });
        return;
      }
      const code = typeof req.query.code === 'string' ? req.query.code : undefined;
      const state = req.cookies.oauth_state as string | undefined;
      const cookieProvider = req.cookies.oauth_provider as string | undefined;
      const codeVerifier = req.cookies.oauth_verifier as string | undefined;
      const queryState = typeof req.query.state === 'string' ? req.query.state : undefined;

      if (!code || !state || state !== queryState || cookieProvider !== provider) {
        res
          .status(400)
          .json({ error: { message: 'Invalid OAuth state', code: 'OAUTH_STATE_INVALID' } });
        return;
      }

      if (provider === 'google' && !codeVerifier) {
        res
          .status(400)
          .json({ error: { message: 'Invalid OAuth state', code: 'OAUTH_STATE_INVALID' } });
        return;
      }

      const { prisma } = await import('../lib/prisma.js');
      const result = await deps.oauthService.callback(
        provider,
        code,
        provider === 'google' ? codeVerifier : undefined,
        prisma,
        deps.authService,
        hashIp(req.ip ?? 'unknown'),
      );

      res.clearCookie('oauth_state');
      res.clearCookie('oauth_provider');
      res.clearCookie('oauth_verifier');
      setRefreshCookie(res, deps.env, result.refreshToken);
      res.redirect(`${deps.env.WEB_APP_URL}/${result.user.locale}`);
    }),
  );

  return router;
}
