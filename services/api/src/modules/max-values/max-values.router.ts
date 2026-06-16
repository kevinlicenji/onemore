import { insertManualMaxSchema, resolvePendingMaxSchema } from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../../lib/errors.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../../middleware/authenticate.js';
import type { MaxValuesService } from './max-values.service.js';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

/**
 * Max-values routes under /api/v1/max-values.
 */
export function createMaxValuesRouter(maxValuesService: MaxValuesService): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const maxValues = await maxValuesService.listActive(authReq.userId ?? '');
      res.json({ maxValues });
    }),
  );

  router.post(
    '/manual',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = insertManualMaxSchema.parse(req.body);
      const maxValue = await maxValuesService.insertManual(authReq.userId ?? '', body);
      res.status(201).json(maxValue);
    }),
  );

  router.get(
    '/pending',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const pending = await maxValuesService.listPending(authReq.userId ?? '');
      res.json({ pending });
    }),
  );

  router.post(
    '/pending/:id/resolve',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const logId = requireRouteParam(req.params.id, 'id');
      const body = resolvePendingMaxSchema.parse(req.body);
      await maxValuesService.resolvePending(authReq.userId ?? '', logId, body.action);
      res.status(200).json({ success: true });
    }),
  );

  router.get(
    '/history/:exerciseId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const exerciseId = requireRouteParam(req.params.exerciseId, 'exerciseId');
      const history = await maxValuesService.getHistory(authReq.userId ?? '', exerciseId);
      res.json({ history });
    }),
  );

  return router;
}
