import { describe, expect, it, vi } from 'vitest';

import { HttpError } from '../lib/errors.js';
import type { AuthenticatedRequest } from './authenticate.js';
import { requireAdmin, requireRole } from './require-role.js';

describe('requireRole', () => {
  it('allows requests with the required role', () => {
    const middleware = requireRole('admin');
    const next = vi.fn();
    const req = { roles: ['athlete', 'admin'] } as AuthenticatedRequest;

    middleware(req, {} as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects requests without the required role', () => {
    const middleware = requireAdmin;
    const next = vi.fn();
    const req = { roles: ['athlete'] } as AuthenticatedRequest;

    middleware(req, {} as never, next);

    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).statusCode).toBe(403);
  });
});
