import type { OnboardingComplete, OnboardingUpdate } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';
import type { UsersService } from '../users/users.service.js';
import { buildOnboardingPatch } from './onboarding-patch.js';

const ONBOARDING_REQUIRED_FIELDS: (keyof OnboardingComplete)[] = [
  'trainingGoal',
  'trainingLevel',
  'trainingEnvironment',
  'trainingDaysPerWeek',
  'preferredSessionMinutes',
  'preferredMuscleGroups',
  'motivationLevel',
];

/**
 * Onboarding profile updates and completion marker.
 */
export class OnboardingService {
  /**
   * @param prisma - Database client.
   * @param usersService - Profile serializer for API responses.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Persist partial onboarding answers from a wizard step.
   *
   * @param userId - Authenticated user id.
   * @param input - One or more onboarding fields.
   * @returns Updated user profile.
   */
  async updateProgress(userId: string, input: OnboardingUpdate) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    if (user.onboardingCompletedAt) {
      throw new HttpError(409, 'Onboarding already completed', 'ONBOARDING_ALREADY_COMPLETE');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: buildOnboardingPatch(input),
    });

    return this.usersService.getMe(userId);
  }

  /**
   * Validate all onboarding fields and set completion timestamp.
   *
   * @param userId - Authenticated user id.
   * @param input - Full onboarding payload.
   * @returns Updated user profile with onboardingCompletedAt set.
   */
  async complete(userId: string, input: OnboardingComplete) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    if (user.onboardingCompletedAt) {
      throw new HttpError(409, 'Onboarding already completed', 'ONBOARDING_ALREADY_COMPLETE');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        trainingGoal: input.trainingGoal,
        trainingLevel: input.trainingLevel,
        trainingEnvironment: input.trainingEnvironment,
        trainingDaysPerWeek: input.trainingDaysPerWeek,
        preferredSessionMinutes: input.preferredSessionMinutes,
        preferredMuscleGroups: input.preferredMuscleGroups,
        motivationLevel: input.motivationLevel,
        onboardingCompletedAt: new Date(),
      },
    });

    return this.usersService.getMe(userId);
  }

  /**
   * Complete onboarding using fields already stored on the user row.
   *
   * @param userId - Authenticated user id.
   * @returns Updated user profile with onboardingCompletedAt set.
   */
  async completeFromStored(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    if (user.onboardingCompletedAt) {
      throw new HttpError(409, 'Onboarding already completed', 'ONBOARDING_ALREADY_COMPLETE');
    }

    const missing = ONBOARDING_REQUIRED_FIELDS.filter((field) => {
      const value = user[field];
      if (field === 'preferredMuscleGroups') {
        return !Array.isArray(value) || value.length === 0;
      }
      return value === null;
    });

    if (missing.length > 0) {
      throw new HttpError(
        400,
        `Missing onboarding fields: ${missing.join(', ')}`,
        'ONBOARDING_INCOMPLETE',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });

    return this.usersService.getMe(userId);
  }
}
