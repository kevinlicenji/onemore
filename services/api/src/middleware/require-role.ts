import type { NextFunction, Response } from 'express';

import { ROLES } from '@onemore/shared';

import { HttpError } from '../lib/errors.js';
import type { AuthenticatedRequest } from './authenticate.js';

/**
 * Require one or more JWT roles on an authenticated request.
 *
 * @param role - Required role slug.
 */
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const roles = req.roles ?? [];
    if (!roles.includes(role)) {
      next(new HttpError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }
    next();
  };
}

/**
 * Middleware shorthand for admin-only routes.
 */
export const requireAdmin = requireRole(ROLES.ADMIN);
