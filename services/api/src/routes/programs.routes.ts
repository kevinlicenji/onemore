import { createProgramSchema } from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { ProgramsService } from '../modules/programs/programs.service.js';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

/**
 * Program routes under /api/v1/programs.
 */
export function createProgramsRouter(programsService: ProgramsService): Router {
  const router = Router();

  router.get(
    '/templates',
    asyncHandler(async (_req, res) => {
      const templates = await programsService.listTemplates();
      res.json({ templates });
    }),
  );

  router.get(
    '/templates/:slug',
    asyncHandler(async (req, res) => {
      const slug = requireRouteParam(req.params.slug, 'slug');
      const template = await programsService.getTemplateBySlug(slug);
      res.json(template);
    }),
  );

  router.post(
    '/templates/:slug/apply',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const slug = requireRouteParam(req.params.slug, 'slug');
      const program = await programsService.applyTemplate(authReq.userId ?? '', slug);
      res.status(201).json(program);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const programs = await programsService.listForUser(authReq.userId ?? '');
      res.json({ programs });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = createProgramSchema.parse(req.body);
      const program = await programsService.create(authReq.userId ?? '', body);
      res.status(201).json(program);
    }),
  );

  router.get(
    '/:programId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const programId = requireRouteParam(req.params.programId, 'programId');
      const program = await programsService.getById(authReq.userId ?? '', programId);
      res.json(program);
    }),
  );

  router.post(
    '/:programId/publish',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const programId = requireRouteParam(req.params.programId, 'programId');
      const program = await programsService.publish(authReq.userId ?? '', programId);
      res.json(program);
    }),
  );

  router.put(
    '/:programId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const programId = requireRouteParam(req.params.programId, 'programId');
      const body = createProgramSchema.parse(req.body);
      const program = await programsService.update(authReq.userId ?? '', programId, body);
      res.json(program);
    }),
  );

  router.delete(
    '/:programId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const programId = requireRouteParam(req.params.programId, 'programId');
      await programsService.delete(authReq.userId ?? '', programId);
      res.status(204).send();
    }),
  );

  router.post(
    '/:programId/activate',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const programId = requireRouteParam(req.params.programId, 'programId');
      const program = await programsService.activate(authReq.userId ?? '', programId);
      res.json(program);
    }),
  );

  return router;
}
