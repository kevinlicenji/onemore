import { Router } from 'express';

/**
 * API v1 route aggregator — mount feature routers here.
 *
 * @returns Express router mounted at /api/v1.
 */
export function createV1Router(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ message: 'OneMore API v1' });
  });

  return router;
}
