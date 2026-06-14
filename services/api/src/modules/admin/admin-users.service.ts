import type { PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';

/**
 * Admin operations on user accounts (admin flag management).
 */
export class AdminUsersService {
  /**
   * @param prisma - Database client.
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Grant or revoke admin privileges for a user.
   */
  async setAdmin(userId: string, isAdmin: boolean): Promise<{ id: string; username: string | null; isAdmin: boolean }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: { id: true, username: true, isAdmin: true },
    });

    return updated;
  }

  /**
   * Find a user by username for admin management.
   */
  async findByUsername(username: string): Promise<{ id: string; username: string | null; isAdmin: boolean } | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true, username: true, isAdmin: true },
    });
    return user;
  }
}
