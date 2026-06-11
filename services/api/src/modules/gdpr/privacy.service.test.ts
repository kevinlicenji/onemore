import { describe, expect, it, vi } from 'vitest';

import { PrivacyService } from './privacy.service.js';

describe('PrivacyService', () => {
  it('soft-deletes user and revokes refresh tokens', async () => {
    const user = {
      id: 'user-1',
      deletedAt: null,
    };

    const prisma = {
      user: {
        findUnique: vi.fn(() => Promise.resolve(user)),
        update: vi.fn(() => Promise.resolve({ ...user, deletedAt: new Date() })),
        delete: vi.fn(),
        findMany: vi.fn(() => Promise.resolve([])),
      },
      refreshToken: {
        updateMany: vi.fn(() => Promise.resolve({ count: 1 })),
      },
      pushSubscription: {
        deleteMany: vi.fn(() => Promise.resolve({ count: 0 })),
      },
      auditLog: {
        create: vi.fn(() => Promise.resolve({})),
      },
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const service = new PrivacyService(prisma as never, logger as never);

    const result = await service.requestAccountDeletion('user-1');

    expect(result.deletedAt).toBeDefined();
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });
});
