import { createHash } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';
import { Apple, Google, generateCodeVerifier, generateState } from 'arctic';
import { decodeJwt } from 'jose';

import type { Env } from '../../config/env.js';
import { HttpError } from '../../lib/errors.js';
import type { AuthService } from './auth.service.js';

export interface OAuthStartResult {
  url: string;
  state: string;
  codeVerifier?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
}

/**
 * OAuth2 flows for Google and Apple via arctic.
 */
export class OAuthService {
  private readonly google: Google | null;
  private readonly apple: Apple | null;

  /**
   * @param env - OAuth client configuration.
   */
  constructor(private readonly env: Env) {
    this.google =
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI
        ? new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI)
        : null;

    this.apple =
      env.APPLE_CLIENT_ID &&
      env.APPLE_TEAM_ID &&
      env.APPLE_KEY_ID &&
      env.APPLE_PRIVATE_KEY &&
      env.APPLE_REDIRECT_URI
        ? new Apple(
            env.APPLE_CLIENT_ID,
            env.APPLE_TEAM_ID,
            env.APPLE_KEY_ID,
            new TextEncoder().encode(env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n')),
            env.APPLE_REDIRECT_URI,
          )
        : null;
  }

  /**
   * @param provider - OAuth provider slug.
   * @returns Authorization URL and optional PKCE verifier (Google only).
   */
  start(provider: 'google' | 'apple'): OAuthStartResult {
    const state = generateState();

    if (provider === 'google') {
      if (!this.google) {
        throw new HttpError(503, 'Google OAuth not configured', 'OAUTH_NOT_CONFIGURED');
      }
      const codeVerifier = generateCodeVerifier();
      const url = this.google.createAuthorizationURL(state, codeVerifier, [
        'openid',
        'email',
        'profile',
      ]);
      return { url: url.toString(), state, codeVerifier };
    }

    if (!this.apple) {
      throw new HttpError(503, 'Apple OAuth not configured', 'OAUTH_NOT_CONFIGURED');
    }
    const url = this.apple.createAuthorizationURL(state, ['name', 'email']);
    return { url: url.toString(), state };
  }

  /**
   * Complete OAuth callback and issue session tokens.
   */
  async callback(
    provider: 'google' | 'apple',
    code: string,
    codeVerifier: string | undefined,
    prisma: PrismaClient,
    authService: AuthService,
    ipHash?: string,
  ) {
    if (provider === 'google' && this.google) {
      if (!codeVerifier) {
        throw new HttpError(400, 'Missing OAuth code verifier', 'OAUTH_STATE_INVALID');
      }
      const tokens = await this.google.validateAuthorizationCode(code, codeVerifier);
      const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      });
      if (!profileResponse.ok) {
        throw new HttpError(400, 'Failed to fetch Google profile', 'OAUTH_PROFILE_FAILED');
      }
      const profile = (await profileResponse.json()) as GoogleUserInfo;
      if (!profile.email) {
        throw new HttpError(400, 'Google did not return email', 'OAUTH_EMAIL_REQUIRED');
      }

      return this.linkOrCreateUser(
        prisma,
        authService,
        'google',
        profile.sub,
        profile.email.toLowerCase(),
        profile.name,
        ipHash,
      );
    }

    if (provider === 'apple' && this.apple) {
      const tokens = await this.apple.validateAuthorizationCode(code);
      const claims = decodeJwt(tokens.idToken());
      const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : undefined;
      const sub = typeof claims.sub === 'string' ? claims.sub : undefined;
      if (!email || !sub) {
        throw new HttpError(400, 'Apple did not return required claims', 'OAUTH_EMAIL_REQUIRED');
      }

      return this.linkOrCreateUser(prisma, authService, 'apple', sub, email, undefined, ipHash);
    }

    throw new HttpError(503, 'OAuth provider not configured', 'OAUTH_NOT_CONFIGURED');
  }

  private async linkOrCreateUser(
    prisma: PrismaClient,
    authService: AuthService,
    provider: 'google' | 'apple',
    providerUserId: string,
    email: string,
    displayName: string | undefined,
    ipHash?: string,
  ) {
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
    });

    if (existingOAuth) {
      return authService.issueSessionForUser(existingOAuth.userId, ipHash, 'auth.oauth_login');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      await prisma.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider,
          providerUserId,
          emailAtProvider: email,
        },
      });
      if (!existingUser.emailVerifiedAt) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerifiedAt: new Date() },
        });
      }
      return authService.issueSessionForUser(existingUser.id, ipHash, 'auth.oauth_link');
    }

    const username = `user_${providerUserId.slice(0, 8).toLowerCase()}`;
    const user = await prisma.user.create({
      data: {
        email,
        emailVerifiedAt: new Date(),
        username,
        displayName: displayName ?? username,
        oauthAccounts: {
          create: { provider, providerUserId, emailAtProvider: email },
        },
      },
    });

    return authService.issueSessionForUser(user.id, ipHash, 'auth.oauth_register');
  }
}

/**
 * Hash client IP for audit logs (no raw PII).
 *
 * @param ip - Request IP address.
 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}
