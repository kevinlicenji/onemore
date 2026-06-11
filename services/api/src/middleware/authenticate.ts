import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../lib/errors.js';
import type { AuthService } from '../modules/auth/auth.service.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  roles?: string[];
}

/**
 * Require valid Bearer access token.
 *
 * @param authService - Auth service for token verification.
 */
export function createAuthenticateMiddleware(authService: AuthService) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(new HttpError(401, 'Missing access token', 'UNAUTHORIZED'));
      return;
    }
    const token = header.slice(7);
    try {
      const { userId, roles } = await authService.verifyAccessToken(token);
      req.userId = userId;
      req.roles = roles;
      next();
    } catch (error) {
      next(error);
    }
  };
}
