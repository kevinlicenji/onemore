import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { Logger } from '../lib/logger.js';

import { createErrorHandler } from './error-handler.js';

function createMockResponse(): Response & { statusCode?: number; body?: unknown } {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode?: number; body?: unknown };
}

describe('createErrorHandler', () => {
  const logger: Logger = {
    error: vi.fn(),
  } as unknown as Logger;

  it('returns client error details for 4xx', () => {
    const handler = createErrorHandler(logger);
    const res = createMockResponse();

    const err = new Error('Invalid payload') as Error & {
      statusCode: number;
      code: string;
    };
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';

    handler(err, {} as Request, res, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: { message: 'Invalid payload', code: 'VALIDATION_ERROR' },
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('masks message for 5xx and logs server errors', () => {
    const handler = createErrorHandler(logger);
    const res = createMockResponse();

    const err = new Error('database exploded') as Error & { statusCode: number };
    err.statusCode = 500;

    handler(err, {} as Request, res, vi.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: { message: 'Internal server error', code: 'UNKNOWN_ERROR' },
    });
    expect(logger.error).toHaveBeenCalled();
  });
});
