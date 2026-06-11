import { pushSubscriptionSchema } from '@onemore/shared';
import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { PushService } from '../modules/notifications/push.service.js';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

/**
 * Push notification routes under /api/v1/notifications.
 */
export function createNotificationsRouter(pushService: PushService): Router {
  const router = Router();

  router.get(
    '/push/vapid-public-key',
    asyncHandler(async (_req, res) => {
      await Promise.resolve();
      res.json({ publicKey: pushService.getPublicKey() });
    }),
  );

  router.post(
    '/push/subscribe',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = pushSubscriptionSchema.parse(req.body);
      await pushService.subscribe(authReq.userId ?? '', body);
      res.status(201).json({ ok: true });
    }),
  );

  router.post(
    '/push/unsubscribe',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = unsubscribeSchema.parse(req.body);
      await pushService.unsubscribe(authReq.userId ?? '', body.endpoint);
      res.json({ ok: true });
    }),
  );

  return router;
}
