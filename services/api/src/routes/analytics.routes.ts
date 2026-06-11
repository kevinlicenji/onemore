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

  return router;
}
