import { updateUserProfileSchema } from '@onemore/shared';
import { Router } from 'express';
import { z } from 'zod';

import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { GdprExportService } from '../modules/gdpr/gdpr-export.service.js';
import type { PrivacyService } from '../modules/gdpr/privacy.service.js';
import type { UsersService } from '../modules/users/users.service.js';
import { enqueueGdprExport } from '../jobs/register-workers.js';
import type { Queue } from 'bullmq';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

export interface UsersRouterDeps {
  usersService: UsersService;
  gdprExportService: GdprExportService;
  privacyService: PrivacyService;
  jobQueue: Queue | null;
}

/**
 * User profile routes under /api/v1/users.
 */
export function createUsersRouter(deps: UsersRouterDeps): Router {
  const router = Router();

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const profile = await deps.usersService.getMe(authReq.userId ?? '');
      res.json(profile);
    }),
  );

  router.patch(
    '/me',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = updateUserProfileSchema.parse(req.body);
      const profile = await deps.usersService.updateMe(authReq.userId ?? '', body);
      res.json(profile);
    }),
  );

  router.post(
    '/me/export',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.userId ?? '';
      const job = await deps.gdprExportService.requestExport(userId);
      await enqueueGdprExport(deps.jobQueue, job.id, async () => {
        await deps.gdprExportService.processExportJob(job.id);
      });
      res.status(202).json({ job });
    }),
  );

  router.get(
    '/me/export/latest',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const job = await deps.gdprExportService.getLatestJob(authReq.userId ?? '');
      res.json({ job });
    }),
  );

  router.get(
    '/me/export/:jobId/download',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const jobId = requireRouteParam(req.params.jobId, 'jobId');
      const query = z
        .object({
          token: z.string().min(1),
          format: z.enum(['json', 'csv']).default('json'),
        })
        .parse(req.query);

      const file = await deps.gdprExportService.downloadExport(
        authReq.userId ?? '',
        jobId,
        query.token,
        query.format,
      );

      const contentType = query.format === 'json' ? 'application/json' : 'text/csv';
      const filename = query.format === 'json' ? 'onemore-export.json' : 'onemore-workouts.csv';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(file);
    }),
  );

  router.delete(
    '/me',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const result = await deps.privacyService.requestAccountDeletion(authReq.userId ?? '');
      res.json(result);
    }),
  );

  return router;
}
