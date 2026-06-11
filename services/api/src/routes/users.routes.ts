import { updateUserProfileSchema } from '@onemore/shared';
import { Router } from 'express';

import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { UsersService } from '../modules/users/users.service.js';

/**
 * User profile routes under /api/v1/users.
 */
export function createUsersRouter(usersService: UsersService): Router {
  const router = Router();

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const profile = await usersService.getMe(authReq.userId ?? '');
      res.json(profile);
    }),
  );

  router.patch(
    '/me',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = updateUserProfileSchema.parse(req.body);
      const profile = await usersService.updateMe(authReq.userId ?? '', body);
      res.json(profile);
    }),
  );

  return router;
}
