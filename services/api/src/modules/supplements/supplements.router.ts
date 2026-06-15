import {
  CreateSupplementInputSchema,
  CreateSupplementLogInputSchema,
  SupplementLogQuerySchema,
  UpdateSupplementInputSchema,
  UpdateSupplementLogInputSchema,
  RepeatYesterdayInputSchema,
} from '@onemore/shared';
import { Router } from 'express';

import { HttpError } from '../../lib/errors.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import type { AuthenticatedRequest } from '../../middleware/authenticate.js';
import type { SupplementsService } from './supplements.service.js';

function requireRouteParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new HttpError(400, `Missing route parameter: ${name}`, 'INVALID_ROUTE_PARAM');
}

function resolveLocale(req: AuthenticatedRequest): string {
  const queryLocale = req.query.locale;
  if (typeof queryLocale === 'string' && (queryLocale === 'it' || queryLocale === 'en')) {
    return queryLocale;
  }
  const acceptLanguage = req.headers['accept-language'];
  if (typeof acceptLanguage === 'string') {
    const preferred = acceptLanguage.split(',')[0]?.split('-')[0];
    if (preferred === 'it' || preferred === 'en') {
      return preferred;
    }
  }
  return 'en';
}

export function createSupplementsRouter(supplementsService: SupplementsService): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const supplements = await supplementsService.list(authReq.userId ?? '', locale);
      res.json({ supplements });
    }),
  );

  router.get(
    '/trend',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
      const trend = await supplementsService.getTrend(authReq.userId ?? '', days, locale);
      res.json(trend);
    }),
  );

  router.get(
    '/logs',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const query = SupplementLogQuerySchema.parse(req.query);
      const result = await supplementsService.listLogs(authReq.userId ?? '', query, locale);
      res.json(result);
    }),
  );

  router.post(
    '/logs/repeat-yesterday',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const body = RepeatYesterdayInputSchema.parse(req.body);
      const result = await supplementsService.repeatYesterday(
        authReq.userId ?? '',
        body.date,
        locale,
      );
      res.status(201).json(result);
    }),
  );

  router.post(
    '/logs',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const body = CreateSupplementLogInputSchema.parse(req.body);
      const log = await supplementsService.createLog(authReq.userId ?? '', body, locale);
      res.status(201).json(log);
    }),
  );

  router.put(
    '/logs/:logId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const logId = requireRouteParam(req.params.logId, 'logId');
      const body = UpdateSupplementLogInputSchema.parse({ ...req.body, id: logId });
      const log = await supplementsService.updateLog(authReq.userId ?? '', body, locale);
      res.json(log);
    }),
  );

  router.delete(
    '/logs/:logId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const logId = requireRouteParam(req.params.logId, 'logId');
      await supplementsService.deleteLog(authReq.userId ?? '', logId);
      res.status(204).send();
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const body = CreateSupplementInputSchema.parse(req.body);
      const supplement = await supplementsService.create(authReq.userId ?? '', body, locale);
      res.status(201).json(supplement);
    }),
  );

  router.get(
    '/:supplementId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const supplementId = requireRouteParam(req.params.supplementId, 'supplementId');
      const supplement = await supplementsService.getById(
        authReq.userId ?? '',
        supplementId,
        locale,
      );
      res.json(supplement);
    }),
  );

  router.put(
    '/:supplementId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const locale = resolveLocale(authReq);
      const supplementId = requireRouteParam(req.params.supplementId, 'supplementId');
      const body = UpdateSupplementInputSchema.parse(req.body);
      const supplement = await supplementsService.update(
        authReq.userId ?? '',
        supplementId,
        body,
        locale,
      );
      res.json(supplement);
    }),
  );

  router.delete(
    '/:supplementId',
    asyncHandler(async (req, res) => {
      const authReq = req as AuthenticatedRequest;
      const supplementId = requireRouteParam(req.params.supplementId, 'supplementId');
      await supplementsService.delete(authReq.userId ?? '', supplementId);
      res.status(204).send();
    }),
  );

  return router;
}
