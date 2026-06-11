import { historyListQuerySchema } from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { HistoryService } from '../modules/history/history.service.js';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

/**
 * Workout history routes under /api/v1/history.
 */
export function createHistoryRouter(historyService: HistoryService): Router {
  const router = Router();

  router.get(
    '/sessions',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const query = historyListQuerySchema.parse(req.query);
      const result = await historyService.listSessions(authReq.userId ?? '', query);
      res.json(result);
    }),
  );

  router.get(
    '/sessions/:sessionId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const sessionId = requireRouteParam(req.params.sessionId, 'sessionId');
      const session = await historyService.getSessionDetail(authReq.userId ?? '', sessionId);
      res.json(session);
    }),
  );

  return router;
}
