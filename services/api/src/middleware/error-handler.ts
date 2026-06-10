import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global Express error handler — returns JSON error payloads.
 *
 * @param logger - Structured logger for server-side errors.
 */
export function createErrorHandler(logger: Logger) {
  return (
    err: ApiError,
    _req: Request,
    res: Response,
    // Express requires 4-arg signature for error middleware.
    _next: NextFunction,
  ): void => {
    const statusCode = err.statusCode ?? 500;
    if (statusCode >= 500) {
      logger.error({ err }, 'Unhandled server error');
    }

    res.status(statusCode).json({
      error: {
        message: statusCode >= 500 ? 'Internal server error' : err.message,
        code: err.code ?? 'UNKNOWN_ERROR',
      },
    });
  };
}
