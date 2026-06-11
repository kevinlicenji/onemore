import { createHash, randomBytes } from 'node:crypto';

/**
 * Generate a cryptographically secure opaque token.
 *
 * @returns Base64url-encoded random string.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hash a token for storage (refresh tokens, reset tokens).
 *
 * @param token - Raw token string.
 * @returns SHA-256 hex digest.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
