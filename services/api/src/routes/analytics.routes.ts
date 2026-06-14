import { Router } from 'express';

import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { AnalyticsService } from '../modules/analytics/analytics.service.js';

/**
 * Analytics routes under /api/v1/analytics.
 */
export function createAnalyticsRouter(analyticsService: AnalyticsService): Router {
  const router = Router();

  router.get(
    '/dashboard',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const dashboard = await analyticsService.getDashboard(authReq.userId ?? '');
      res.json(dashboard);
    }),
  );

  router.get(
    '/personal-records',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const limit = Math.min(Number(req.query.limit ?? 200), 500);
      const records = await analyticsService.listPersonalRecords(authReq.userId ?? '', limit);
      res.json({ items: records });
    }),
  );

  return router;
}
