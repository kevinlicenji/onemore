import { importPKCS8, importSPKI, type KeyLike, SignJWT, jwtVerify } from 'jose';

import type { Env } from '../../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  roles: string[];
}

/**
 * Sign and verify RS256 access JWTs.
 */
export class TokenService {
  private privateKey: KeyLike | null = null;
  private publicKey: KeyLike | null = null;

  /**
   * @param env - Environment with JWT key material.
   */
  constructor(private readonly env: Env) {}

  /**
   * @param userId - Subject user id.
   * @param roles - Role strings for RBAC.
   * @returns Signed JWT and expiry seconds.
   */
  async signAccessToken(
    userId: string,
    roles: string[],
  ): Promise<{ token: string; expiresIn: number }> {
    const privateKey = await this.getPrivateKey();
    const expiresIn = this.env.ACCESS_TOKEN_TTL_SECONDS;
    const token = await new SignJWT({ roles })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${String(expiresIn)}s`)
      .sign(privateKey);

    return { token, expiresIn };
  }

  /**
   * @param token - Bearer access token.
   * @returns Verified payload.
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const publicKey = await this.getPublicKey();
    const { payload } = await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
    if (!payload.sub) {
      throw new Error('Invalid token subject');
    }
    const roles = Array.isArray(payload.roles)
      ? payload.roles.filter((r): r is string => typeof r === 'string')
      : [];
    return { sub: payload.sub, roles };
  }

  private async getPrivateKey(): Promise<KeyLike> {
    if (!this.privateKey) {
      this.privateKey = await importPKCS8(this.env.jwtPrivateKeyPem, 'RS256');
    }
    return this.privateKey;
  }

  private async getPublicKey(): Promise<KeyLike> {
    if (!this.publicKey) {
      this.publicKey = await importSPKI(this.env.jwtPublicKeyPem, 'RS256');
    }
    return this.publicKey;
  }
}
