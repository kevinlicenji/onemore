import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wrap async route handlers so errors reach Express error middleware.
 *
 * @param handler - Async request handler.
 * @returns Express-compatible handler.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
