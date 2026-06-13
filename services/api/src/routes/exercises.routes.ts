import {
  createCustomExerciseSchema,
  exerciseSearchQuerySchema,
  updateCustomExerciseSchema,
} from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { ExercisesService } from '../modules/exercises/exercises.service.js';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

/**
 * Exercise library routes under /api/v1/exercises.
 */
export function createExercisesRouter(exercisesService: ExercisesService): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const query = exerciseSearchQuerySchema.parse(req.query);
      const exercises = await exercisesService.list(authReq.userId ?? '', query);
      res.json({ exercises });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = createCustomExerciseSchema.parse(req.body);
      const exercise = await exercisesService.createCustom(authReq.userId ?? '', body);
      res.status(201).json(exercise);
    }),
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const body = updateCustomExerciseSchema.parse(req.body);
      const exercise = await exercisesService.updateCustom(
        authReq.userId ?? '',
        requireRouteParam(req.params.id, 'id'),
        body,
      );
      res.json(exercise);
    }),
  );

  return router;
}
