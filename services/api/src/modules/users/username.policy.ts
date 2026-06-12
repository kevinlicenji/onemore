import { HttpError } from '../../lib/errors.js';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const SIX_MONTHS_MS = 183 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Validate username format.
 *
 * @param username - Proposed username.
 */
export function validateUsernameFormat(username: string): void {
  if (username.includes('@')) {
    throw new HttpError(400, 'Username cannot contain @', 'INVALID_USERNAME');
  }

  if (!USERNAME_REGEX.test(username)) {
    throw new HttpError(
      400,
      'Username must be 3–30 characters, alphanumeric or underscore',
      'INVALID_USERNAME',
    );
  }
}

/**
 * Enforce username change cooldown policy (Data Model §16).
 *
 * @param usernameChangedAt - Last change timestamp or null if never changed.
 * @param createdAt - Account creation time.
 */
export function assertUsernameChangeAllowed(usernameChangedAt: Date | null, createdAt: Date): void {
  if (!usernameChangedAt) {
    return;
  }

  const now = Date.now();
  const changedMs = usernameChangedAt.getTime();
  const accountAgeMs = now - createdAt.getTime();

  if (accountAgeMs < THIRTY_DAYS_MS) {
    return;
  }

  const sinceChange = now - changedMs;
  if (sinceChange < SIX_MONTHS_MS) {
    throw new HttpError(
      400,
      'Username can only be changed once every 6 months',
      'USERNAME_CHANGE_COOLDOWN',
    );
  }
}
