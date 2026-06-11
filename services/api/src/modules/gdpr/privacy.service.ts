import type { AccountDeletionResponse } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';
import type { Logger } from '../../lib/logger.js';

const SOFT_DELETE_RETENTION_DAYS = 30;

/**
 * Account soft-delete and hard-delete (GDPR).
 */
export class PrivacyService {
  /**
   * @param prisma - Database client.
   * @param logger - Structured logger.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
  ) {}

  /**
   * Soft-delete the user account (30-day retention before hard delete).
   *
   * @param userId - Authenticated user id.
   */
  async requestAccountDeletion(userId: string): Promise<AccountDeletionResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const deletedAt = new Date();
    const scheduledHardDeleteAt = new Date(
      deletedAt.getTime() + SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: deletedAt },
      }),
      this.prisma.pushSubscription.deleteMany({ where: { userId } }),
      this.prisma.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'user.deletion_requested',
          resourceType: 'user',
          resourceId: userId,
        },
      }),
    ]);

    this.logger.info({ userId }, 'Account soft-deleted');

    return {
      deletedAt: deletedAt.toISOString(),
      scheduledHardDeleteAt: scheduledHardDeleteAt.toISOString(),
    };
  }

  /**
   * Permanently delete users past the soft-delete window (AC-RBAC-05).
   */
  async processHardDeletes(): Promise<number> {
    const cutoff = new Date(Date.now() - SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { deletedAt: { lte: cutoff } },
      select: { id: true },
    });

    for (const user of users) {
      await this.prisma.user.delete({ where: { id: user.id } });
      this.logger.info({ userId: user.id }, 'Account hard-deleted');
    }

    return users.length;
  }
}
