import { Router } from 'express';

import type { Env } from '../config/env.js';

/**
 * Health check routes (unversioned — used by load balancers).
 *
 * @param env - Application environment (version string).
 * @returns Express router.
 */
export function createHealthRouter(env: Env): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: env.API_VERSION,
    });
  });

  return router;
}
