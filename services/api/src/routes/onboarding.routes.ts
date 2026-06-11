import { onboardingCompleteSchema, onboardingUpdateSchema } from '@onemore/shared';
import { Router } from 'express';

import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { OnboardingService } from '../modules/onboarding/onboarding.service.js';

/**
 * Onboarding routes under /api/v1/onboarding.
 */
export function createOnboardingRouter(onboardingService: OnboardingService): Router {
  const router = Router();

  router.patch(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = onboardingUpdateSchema.parse(req.body);
      const profile = await onboardingService.updateProgress(authReq.userId ?? '', body);
      res.json(profile);
    }),
  );

  router.post(
    '/complete',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = onboardingCompleteSchema.parse(req.body);
      const profile = await onboardingService.complete(authReq.userId ?? '', body);
      res.json(profile);
    }),
  );

  return router;
}
