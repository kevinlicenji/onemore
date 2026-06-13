import { describe, expect, it, vi } from 'vitest';

import { HttpError } from '../../lib/errors.js';
import { OnboardingService } from './onboarding.service.js';
import type { UsersService } from '../users/users.service.js';

function createMockPrisma() {
  const user: {
    id: string;
    deletedAt: null;
    onboardingCompletedAt: Date | null;
    trainingGoal: string | null;
    trainingLevel: string | null;
    trainingEnvironment: string | null;
    trainingDaysPerWeek: number | null;
    motivationLevel: number | null;
  } = {
    id: 'user-1',
    deletedAt: null,
    onboardingCompletedAt: null,
    trainingGoal: null,
    trainingLevel: null,
    trainingEnvironment: null,
    trainingDaysPerWeek: null,
    motivationLevel: null,
  };

  type UserUpdateArgs = {
    where: { id: string };
    data: {
      trainingGoal?: string;
      trainingLevel?: string;
      trainingEnvironment?: string;
      trainingDaysPerWeek?: number;
      motivationLevel?: number;
      onboardingCompletedAt?: Date;
    };
  };

  const findUnique = vi.fn(() => Promise.resolve(user));
  const update = vi.fn((_args: UserUpdateArgs) =>
    Promise.resolve({
      ...user,
      trainingGoal: 'mass',
      trainingLevel: 'beginner',
      trainingEnvironment: 'gym',
      trainingDaysPerWeek: 3,
      motivationLevel: 2,
      onboardingCompletedAt: new Date('2026-06-01T00:00:00.000Z'),
    }),
  );

  return {
    user: { findUnique, update },
    _user: user,
  };
}

function createUsersServiceMock() {
  const getMe = vi.fn(() =>
    Promise.resolve({
      id: 'user-1',
      onboardingCompletedAt: '2026-06-01T00:00:00.000Z',
    }),
  );
  return { getMe } as unknown as UsersService & { getMe: typeof getMe };
}

describe('OnboardingService', () => {
  it('updates partial onboarding progress', async () => {
    const prisma = createMockPrisma();
    const usersService = createUsersServiceMock();
    const service = new OnboardingService(prisma as never, usersService);

    await service.updateProgress('user-1', { trainingGoal: 'mass' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { trainingGoal: 'mass' },
    });
    expect(usersService.getMe).toHaveBeenCalledWith('user-1');
  });

  it('rejects update when onboarding already completed', async () => {
    const prisma = createMockPrisma();
    prisma._user.onboardingCompletedAt = new Date();
    const service = new OnboardingService(prisma as never, createUsersServiceMock());

    await expect(service.updateProgress('user-1', { trainingGoal: 'mass' })).rejects.toThrow(
      HttpError,
    );
  });

  it('completes onboarding with full payload', async () => {
    const prisma = createMockPrisma();
    const usersService = createUsersServiceMock();
    const service = new OnboardingService(prisma as never, usersService);

    await service.complete('user-1', {
      trainingGoal: 'strength',
      trainingLevel: 'beginner',
      trainingEnvironment: 'home',
      trainingDaysPerWeek: 4,
      preferredSessionMinutes: 45,
      preferredMuscleGroups: ['back'],
      motivationLevel: 3,
    });

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0];
    expect(updateCall).toBeDefined();
    expect(updateCall?.[0].data.trainingGoal).toBe('strength');
    expect(updateCall?.[0].data.onboardingCompletedAt).toBeInstanceOf(Date);
  });

  it('rejects completeFromStored when fields are missing', async () => {
    const prisma = createMockPrisma();
    const service = new OnboardingService(prisma as never, createUsersServiceMock());

    await expect(service.completeFromStored('user-1')).rejects.toThrow(HttpError);
  });
});
