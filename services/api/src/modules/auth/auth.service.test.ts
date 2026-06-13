import { describe, expect, it, vi } from 'vitest';

import type { Env } from '../../config/env.js';
import { AuthService } from './auth.service.js';

function createEnv(): Env {
  return {
    NODE_ENV: 'test',
    API_PORT: 4000,
    DATABASE_URL: 'postgresql://test',
    LOG_LEVEL: 'error',
    API_VERSION: 'test',
    WEB_APP_URL: 'http://localhost:3000',
    API_PUBLIC_URL: 'http://localhost:4000',
    EXPORT_STORAGE_PATH: './data/exports-test',
    REFRESH_COOKIE_NAME: 'onemore_refresh',
    ACCESS_TOKEN_TTL_SECONDS: 900,
    REFRESH_TOKEN_TTL_DAYS: 7,
    CONSENT_VERSION_TOS: 'tos',
    CONSENT_VERSION_PRIVACY: 'privacy',
    CONSENT_VERSION_FITNESS: 'fitness',
    jwtPrivateKeyPem: 'key',
    jwtPublicKeyPem: 'pub',
  };
}

const userRecord = {
  id: 'user-1',
  email: 'athlete@example.com',
  username: 'athlete42',
  displayName: 'Athlete',
  locale: 'it',
  deletedAt: null,
  credential: { passwordHash: 'hash' },
};

describe('AuthService.login', () => {
  it('looks up user by email when identifier contains @', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(() => Promise.resolve(userRecord)),
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
      refreshToken: { create: vi.fn(() => Promise.resolve({})) },
      auditLog: { create: vi.fn(() => Promise.resolve({})) },
    };
    const service = new AuthService(prisma as never, createEnv(), {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as never);

    vi.spyOn(service['passwordService'], 'verify').mockResolvedValue(true);
    vi.spyOn(service['tokenService'], 'signAccessToken').mockResolvedValue({
      token: 'access',
      expiresIn: 900,
    });

    await service.login({ identifier: 'Athlete@Example.com', password: 'secret' });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'athlete@example.com' },
      include: { credential: true },
    });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('looks up user by username when identifier has no @', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(() => Promise.resolve(null)),
        findFirst: vi.fn(() => Promise.resolve(userRecord)),
      },
      refreshToken: { create: vi.fn(() => Promise.resolve({})) },
      auditLog: { create: vi.fn(() => Promise.resolve({})) },
    };
    const service = new AuthService(prisma as never, createEnv(), {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as never);

    vi.spyOn(service['passwordService'], 'verify').mockResolvedValue(true);
    vi.spyOn(service['tokenService'], 'signAccessToken').mockResolvedValue({
      token: 'access',
      expiresIn: 900,
    });

    await service.login({ identifier: 'Athlete42', password: 'secret' });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { username: { equals: 'athlete42', mode: 'insensitive' } },
      include: { credential: true },
    });
  });
});

describe('AuthService.changePassword', () => {
  it('rejects an incorrect current password', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(() => Promise.resolve(userRecord)),
      },
      userCredential: { update: vi.fn() },
      auditLog: { create: vi.fn(() => Promise.resolve({})) },
    };
    const service = new AuthService(prisma as never, createEnv(), {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as never);

    vi.spyOn(service['passwordService'], 'verify').mockResolvedValue(false);

    await expect(
      service.changePassword('user-1', 'wrong-password', 'new-password-1'),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('updates the password hash when the current password is valid', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(() => Promise.resolve(userRecord)),
      },
      userCredential: {
        update: vi.fn(() => Promise.resolve({})),
      },
      auditLog: { create: vi.fn(() => Promise.resolve({})) },
    };
    const service = new AuthService(prisma as never, createEnv(), {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as never);

    vi.spyOn(service['passwordService'], 'verify').mockResolvedValue(true);
    vi.spyOn(service['passwordService'], 'isBreached').mockResolvedValue(false);
    vi.spyOn(service['passwordService'], 'hash').mockResolvedValue('new-hash');

    await service.changePassword('user-1', 'current-password', 'new-password-1');

    const updateMock = prisma.userCredential.update;
    expect(updateMock).toHaveBeenCalledOnce();
    const updateArgs = updateMock.mock.calls[0]?.[0] as {
      where: { userId: string };
      data: { passwordHash: string; passwordChangedAt: Date };
    };
    expect(updateArgs.where).toEqual({ userId: 'user-1' });
    expect(updateArgs.data.passwordHash).toBe('new-hash');
    expect(updateArgs.data.passwordChangedAt).toBeInstanceOf(Date);
  });
});
