import { createHash } from 'node:crypto';

import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * Password hashing and verification.
 */
export class PasswordService {
  /**
   * @param plain - Raw password.
   * @returns bcrypt hash.
   */
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  /**
   * @param plain - Raw password.
   * @param hash - Stored bcrypt hash.
   * @returns Whether password matches.
   */
  async verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Check password against Have I Been Pwned k-anonymity API.
   * Skips silently when network fails (dev-friendly).
   *
   * @param password - Password to check.
   * @returns True if password appears in breach corpus.
   */
  async isBreached(password: string): Promise<boolean> {
    try {
      const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!response.ok) {
        return false;
      }
      const body = await response.text();
      return body.split('\n').some((line) => line.startsWith(suffix));
    } catch {
      return false;
    }
  }
}
