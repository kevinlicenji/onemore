import { syncBatchRequestSchema, syncDeltaQuerySchema } from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { SyncService } from '../modules/sync/sync.service.js';

/**
 * Offline sync routes under /api/v1/sync.
 */
export function createSyncRouter(syncService: SyncService): Router {
  const router = Router();

  router.post(
    '/batch',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const idempotencyKey = req.header('Idempotency-Key');
      if (!idempotencyKey || idempotencyKey.trim().length === 0) {
        throw new HttpError(400, 'Idempotency-Key header is required', 'MISSING_IDEMPOTENCY_KEY');
      }

      const body = syncBatchRequestSchema.parse(req.body);
      const result = await syncService.processBatch(authReq.userId ?? '', idempotencyKey, body);
      res.json(result);
    }),
  );

  router.get(
    '/delta',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const query = syncDeltaQuerySchema.parse(req.query);
      const delta = await syncService.getDelta(authReq.userId ?? '', query.since);
      res.json(delta);
    }),
  );

  return router;
}
