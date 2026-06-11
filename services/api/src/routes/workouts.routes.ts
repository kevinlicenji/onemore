import {
  addWorkoutExerciseSchema,
  startWorkoutSessionSchema,
  upsertSetLogSchema,
} from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { WorkoutsService } from '../modules/workouts/workouts.service.js';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

/**
 * Workout session routes under /api/v1/workouts.
 */
export function createWorkoutsRouter(workoutsService: WorkoutsService): Router {
  const router = Router();

  router.get(
    '/next',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const preview = await workoutsService.getNextWorkoutPreview(authReq.userId ?? '');
      res.json(preview);
    }),
  );

  router.get(
    '/sessions/active',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const session = await workoutsService.getActiveSession(authReq.userId ?? '');
      res.json({ session });
    }),
  );

  router.post(
    '/sessions',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = startWorkoutSessionSchema.parse(req.body);
      const session = await workoutsService.startSession(authReq.userId ?? '', body);
      res.status(201).json(session);
    }),
  );

  router.get(
    '/sessions/:sessionId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const sessionId = requireRouteParam(req.params.sessionId, 'sessionId');
      const session = await workoutsService.getSession(authReq.userId ?? '', sessionId);
      res.json(session);
    }),
  );

  router.put(
    '/sessions/:sessionId/sets',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const sessionId = requireRouteParam(req.params.sessionId, 'sessionId');
      const body = upsertSetLogSchema.parse(req.body);
      const session = await workoutsService.upsertSet(authReq.userId ?? '', sessionId, body);
      res.json(session);
    }),
  );

  router.post(
    '/sessions/:sessionId/exercises',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const sessionId = requireRouteParam(req.params.sessionId, 'sessionId');
      const body = addWorkoutExerciseSchema.parse(req.body);
      const session = await workoutsService.addExercise(authReq.userId ?? '', sessionId, body);
      res.status(201).json(session);
    }),
  );

  router.post(
    '/sessions/:sessionId/complete',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const sessionId = requireRouteParam(req.params.sessionId, 'sessionId');
      const session = await workoutsService.completeSession(authReq.userId ?? '', sessionId);
      res.json(session);
    }),
  );

  router.post(
    '/sessions/:sessionId/abandon',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const sessionId = requireRouteParam(req.params.sessionId, 'sessionId');
      const session = await workoutsService.abandonSession(authReq.userId ?? '', sessionId);
      res.json(session);
    }),
  );

  return router;
}
