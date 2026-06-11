import type { LoginBody, RegisterBody } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import type { Env } from '../../config/env.js';
import { HttpError } from '../../lib/errors.js';
import { generateSecureToken, hashToken } from '../../lib/hash.js';
import type { Logger } from '../../lib/logger.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    locale: string;
  };
}

/**
 * Core authentication flows: register, login, refresh, logout, password reset.
 */
export class AuthService {
  private readonly passwordService = new PasswordService();
  private readonly tokenService: TokenService;

  /**
   * @param prisma - Database client.
   * @param env - Application environment.
   * @param logger - Structured logger.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly env: Env,
    private readonly logger: Logger,
  ) {
    this.tokenService = new TokenService(env);
  }

  /**
   * Register a new user with email/password and required consents.
   */
  async register(input: RegisterBody, ipHash?: string): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const usernameTaken = await this.prisma.user.findFirst({
      where: { username: { equals: input.username, mode: 'insensitive' } },
    });
    if (usernameTaken) {
      throw new HttpError(409, 'Username already taken', 'USERNAME_EXISTS');
    }

    if (await this.passwordService.isBreached(input.password)) {
      throw new HttpError(400, 'Password found in known data breaches', 'PASSWORD_BREACHED');
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username.toLowerCase(),
        displayName: input.displayName ?? input.username,
        locale: input.locale,
        birthYear: input.birthYear,
        timezone: input.timezone,
        fitnessDataConsentedAt: now,
        credential: {
          create: { passwordHash },
        },
        consentRecords: {
          create: [
            {
              consentType: 'tos',
              consentVersion: this.env.CONSENT_VERSION_TOS,
              granted: true,
              recordedAt: now,
              ipHash,
            },
            {
              consentType: 'privacy',
              consentVersion: this.env.CONSENT_VERSION_PRIVACY,
              granted: true,
              recordedAt: now,
              ipHash,
            },
            {
              consentType: 'fitness_data',
              consentVersion: this.env.CONSENT_VERSION_FITNESS,
              granted: true,
              recordedAt: now,
              ipHash,
            },
          ],
        },
      },
    });

    await this.writeAudit(user.id, 'auth.register', 'user', user.id, ipHash);

    return this.issueTokens(user.id, user.email, user.username, user.displayName, user.locale);
  }

  /**
   * Authenticate with email and password.
   */
  async login(input: LoginBody, ipHash?: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { credential: true },
    });

    if (!user?.credential || user.deletedAt) {
      throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await this.passwordService.verify(input.password, user.credential.passwordHash);
    if (!valid) {
      throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    await this.writeAudit(user.id, 'auth.login', 'user', user.id, ipHash);

    return this.issueTokens(user.id, user.email, user.username, user.displayName, user.locale);
  }

  /**
   * Rotate refresh token and issue new access token.
   */
  async refresh(rawRefreshToken: string, ipHash?: string): Promise<AuthResult> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!stored || stored.user.deletedAt) {
      throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    await this.writeAudit(stored.userId, 'auth.refresh', 'user', stored.userId, ipHash);

    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.username,
      stored.user.displayName,
      stored.user.locale,
    );
  }

  /**
   * Revoke refresh token (logout).
   */
  async logout(rawRefreshToken: string | undefined, ipHash?: string): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });
    if (stored) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      await this.writeAudit(stored.userId, 'auth.logout', 'user', stored.userId, ipHash);
    }
  }

  /**
   * Start password reset — creates token and logs email (Resend when configured).
   */
  async forgotPassword(email: string, ipHash?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal whether email exists
      return;
    }

    const rawToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt,
      },
    });

    this.logger.info({ userId: user.id }, 'Password reset requested');

    await this.writeAudit(user.id, 'auth.password_reset_requested', 'user', user.id, ipHash);
  }

  /**
   * Complete password reset with token.
   */
  async resetPassword(token: string, newPassword: string, ipHash?: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { credential: true } } },
    });

    if (!record) {
      throw new HttpError(400, 'Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    if (await this.passwordService.isBreached(newPassword)) {
      throw new HttpError(400, 'Password found in known data breaches', 'PASSWORD_BREACHED');
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.userCredential.upsert({
        where: { userId: record.userId },
        create: { userId: record.userId, passwordHash },
        update: { passwordHash, passwordChangedAt: new Date() },
      }),
    ]);

    await this.writeAudit(
      record.userId,
      'auth.password_reset_completed',
      'user',
      record.userId,
      ipHash,
    );
  }

  /**
   * Issue tokens for an existing user (OAuth completion, account linking).
   */
  async issueSessionForUser(
    userId: string,
    ipHash?: string,
    auditAction = 'auth.login',
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    }

    await this.writeAudit(user.id, auditAction, 'user', user.id, ipHash);

    return this.issueTokens(user.id, user.email, user.username, user.displayName, user.locale);
  }

  /**
   * Verify access token string.
   */
  async verifyAccessToken(token: string): Promise<{ userId: string; roles: string[] }> {
    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { deletedAt: true },
      });
      if (!user || user.deletedAt) {
        throw new HttpError(401, 'Invalid access token', 'INVALID_ACCESS_TOKEN');
      }
      return { userId: payload.sub, roles: payload.roles };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(401, 'Invalid access token', 'INVALID_ACCESS_TOKEN');
    }
  }

  private async issueTokens(
    userId: string,
    email: string,
    username: string | null,
    displayName: string | null,
    locale: string,
  ): Promise<AuthResult> {
    const roles = ['athlete'];
    const { token, expiresIn } = await this.tokenService.signAccessToken(userId, roles);
    const refreshToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken: token,
      expiresIn,
      refreshToken,
      user: { id: userId, email, username, displayName, locale },
    };
  }

  private async writeAudit(
    actorUserId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    ipHash?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        resourceType,
        resourceId,
        ipHash,
      },
    });
  }
}
