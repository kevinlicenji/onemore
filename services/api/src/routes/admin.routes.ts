import {
  adminCreateSupplementSchema,
  adminCreateSystemExerciseSchema,
  adminCreateTemplateSchema,
  adminDuplicateTemplateSchema,
  adminSetUserAdminSchema,
  adminUpdateSupplementSchema,
  adminUpdateSystemExerciseSchema,
  adminUpdateTemplateSchema,
} from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/require-role.js';
import type { AdminExercisesService } from '../modules/admin/admin-exercises.service.js';
import type { AdminSupplementsService } from '../modules/admin/admin-supplements.service.js';
import type { AdminTemplatesService } from '../modules/admin/admin-templates.service.js';
import type { AdminUsersService } from '../modules/admin/admin-users.service.js';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

export interface AdminRouterDeps {
  adminExercisesService: AdminExercisesService;
  adminSupplementsService: AdminSupplementsService;
  adminTemplatesService: AdminTemplatesService;
  adminUsersService: AdminUsersService;
}

/**
 * Admin-only routes for global catalog management.
 */
export function createAdminRouter(deps: AdminRouterDeps): Router {
  const router = Router();

  router.use(requireAdmin);

  router.get(
    '/exercises',
    asyncHandler(async (_req, res) => {
      const exercises = await deps.adminExercisesService.list();
      res.json({ exercises });
    }),
  );

  router.post(
    '/exercises',
    asyncHandler(async (req, res) => {
      const body = adminCreateSystemExerciseSchema.parse(req.body);
      const exercise = await deps.adminExercisesService.create(body);
      res.status(201).json(exercise);
    }),
  );

  router.patch(
    '/exercises/:id',
    asyncHandler(async (req, res) => {
      const body = adminUpdateSystemExerciseSchema.parse(req.body);
      const exercise = await deps.adminExercisesService.update(
        requireRouteParam(req.params.id, 'id'),
        body,
      );
      res.json(exercise);
    }),
  );

  router.delete(
    '/exercises/:id',
    asyncHandler(async (req, res) => {
      const exercise = await deps.adminExercisesService.softDelete(
        requireRouteParam(req.params.id, 'id'),
      );
      res.json(exercise);
    }),
  );

  router.get(
    '/supplements',
    asyncHandler(async (_req, res) => {
      const items = await deps.adminSupplementsService.list();
      res.json({ supplements: items });
    }),
  );

  router.post(
    '/supplements',
    asyncHandler(async (req, res) => {
      const body = adminCreateSupplementSchema.parse(req.body);
      const item = await deps.adminSupplementsService.create(body);
      res.status(201).json(item);
    }),
  );

  router.patch(
    '/supplements/:id',
    asyncHandler(async (req, res) => {
      const body = adminUpdateSupplementSchema.parse(req.body);
      const item = await deps.adminSupplementsService.update(
        requireRouteParam(req.params.id, 'id'),
        body,
      );
      res.json(item);
    }),
  );

  router.delete(
    '/supplements/:id',
    asyncHandler(async (req, res) => {
      await deps.adminSupplementsService.delete(requireRouteParam(req.params.id, 'id'));
      res.status(204).send();
    }),
  );

  router.get(
    '/templates',
    asyncHandler(async (_req, res) => {
      const templates = await deps.adminTemplatesService.list();
      res.json({ templates });
    }),
  );

  router.get(
    '/templates/:slug',
    asyncHandler(async (req, res) => {
      const template = await deps.adminTemplatesService.getBySlug(
        requireRouteParam(req.params.slug, 'slug'),
      );
      res.json(template);
    }),
  );

  router.post(
    '/templates',
    asyncHandler(async (req, res) => {
      const body = adminCreateTemplateSchema.parse(req.body);
      const template = await deps.adminTemplatesService.create(body);
      res.status(201).json(template);
    }),
  );

  router.patch(
    '/templates/:slug',
    asyncHandler(async (req, res) => {
      const body = adminUpdateTemplateSchema.parse(req.body);
      const template = await deps.adminTemplatesService.update(
        requireRouteParam(req.params.slug, 'slug'),
        body,
      );
      res.json(template);
    }),
  );

  router.post(
    '/templates/:slug/duplicate',
    asyncHandler(async (req, res) => {
      const body = adminDuplicateTemplateSchema.parse(req.body);
      const template = await deps.adminTemplatesService.duplicate(
        requireRouteParam(req.params.slug, 'slug'),
        body,
      );
      res.status(201).json(template);
    }),
  );

  router.post(
    '/templates/:slug/publish',
    asyncHandler(async (req, res) => {
      const template = await deps.adminTemplatesService.publish(
        requireRouteParam(req.params.slug, 'slug'),
      );
      res.json(template);
    }),
  );

  router.delete(
    '/templates/:slug',
    asyncHandler(async (req, res) => {
      await deps.adminTemplatesService.softDelete(requireRouteParam(req.params.slug, 'slug'));
      res.status(204).send();
    }),
  );

  router.patch(
    '/users/:userId/admin',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const targetUserId = requireRouteParam(req.params.userId, 'userId');
      if (targetUserId === authReq.userId) {
        throw new HttpError(400, 'Cannot change your own admin status', 'ADMIN_SELF_DENY');
      }
      const body = adminSetUserAdminSchema.parse(req.body);
      const user = await deps.adminUsersService.setAdmin(targetUserId, body.isAdmin);
      res.json({ user });
    }),
  );

  router.get(
    '/users/by-username/:username',
    asyncHandler(async (req, res) => {
      const user = await deps.adminUsersService.findByUsername(
        requireRouteParam(req.params.username, 'username'),
      );
      if (!user) {
        throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
      }
      res.json({ user });
    }),
  );

  return router;
}
