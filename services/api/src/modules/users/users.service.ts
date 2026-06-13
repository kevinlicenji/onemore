import type { PrismaClient } from '@prisma/client';
import type { UpdateUserProfile, UserSettings } from '@onemore/shared';
import { formatDisplayName } from '@onemore/shared';

import { HttpError } from '../../lib/errors.js';
import { mergeUserSettings, parseUserSettings } from '../../lib/settings.js';
import { assertUsernameChangeAllowed, validateUsernameFormat } from './username.policy.js';

/**
 * User profile read and update operations.
 */
export class UsersService {
  /**
   * @param prisma - Database client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * @param userId - Authenticated user id.
   * @returns Public profile fields.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return this.toProfile(user);
  }

  /**
   * @param userId - Authenticated user id.
   * @param input - Partial profile update.
   */
  async updateMe(userId: string, input: UpdateUserProfile) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    let username = user.username;
    if (input.username && input.username.toLowerCase() !== user.username?.toLowerCase()) {
      validateUsernameFormat(input.username);
      assertUsernameChangeAllowed(user.usernameChangedAt, user.createdAt);

      const taken = await this.prisma.user.findFirst({
        where: {
          username: { equals: input.username, mode: 'insensitive' },
          NOT: { id: userId },
        },
      });
      if (taken) {
        throw new HttpError(409, 'Username already taken', 'USERNAME_EXISTS');
      }
      username = input.username.toLowerCase();
    }

    const nextSettings = input.settings
      ? mergeUserSettings(parseUserSettings(user.settings), input.settings)
      : undefined;

    const nextDisplayName =
      input.firstName !== undefined || input.lastName !== undefined
        ? (formatDisplayName(input.firstName ?? user.firstName, input.lastName ?? user.lastName) ??
          user.displayName)
        : input.displayName;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: nextDisplayName,
        username,
        usernameChangedAt:
          input.username && input.username.toLowerCase() !== user.username?.toLowerCase()
            ? new Date()
            : undefined,
        locale: input.locale,
        birthYear: input.birthYear,
        heightCm: input.heightCm,
        timezone: input.timezone,
        motivationLevel: input.motivationLevel,
        trainingGoal: input.trainingGoal,
        trainingLevel: input.trainingLevel,
        trainingEnvironment: input.trainingEnvironment,
        trainingDaysPerWeek: input.trainingDaysPerWeek,
        ...(nextSettings ? { settings: nextSettings } : {}),
      },
    });

    return this.toProfile(updated);
  }

  private toProfile(user: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    locale: string;
    birthYear: number | null;
    heightCm: { toString(): string } | null;
    weightKg: { toString(): string } | null;
    timezone: string;
    motivationLevel: number | null;
    onboardingCompletedAt: Date | null;
    trainingGoal: string | null;
    trainingLevel: string | null;
    trainingEnvironment: string | null;
    trainingDaysPerWeek: number | null;
    preferredSessionMinutes: number | null;
    preferredMuscleGroups: string[];
    isCoach: boolean;
    mfaEnabled: boolean;
    settings: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const settings: UserSettings = parseUserSettings(user.settings);
    return {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      locale: user.locale as 'it' | 'en',
      birthYear: user.birthYear,
      heightCm: user.heightCm ? Number(user.heightCm) : null,
      weightKg: user.weightKg ? Number(user.weightKg) : null,
      timezone: user.timezone,
      motivationLevel: user.motivationLevel,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      trainingGoal: user.trainingGoal,
      trainingLevel: user.trainingLevel,
      trainingEnvironment: user.trainingEnvironment,
      trainingDaysPerWeek: user.trainingDaysPerWeek,
      preferredSessionMinutes: user.preferredSessionMinutes,
      preferredMuscleGroups: user.preferredMuscleGroups.filter((muscle) => muscle.length > 0),
      isCoach: user.isCoach,
      mfaEnabled: user.mfaEnabled,
      settings,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
