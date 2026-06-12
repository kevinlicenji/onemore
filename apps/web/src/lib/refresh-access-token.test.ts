import { describe, expect, it } from 'vitest';

import { isInvalidAccessTokenError } from './refresh-access-token';

describe('isInvalidAccessTokenError', () => {
  it('returns true for invalid access token API errors', () => {
    expect(isInvalidAccessTokenError(new Error('Invalid access token'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isInvalidAccessTokenError(new Error('Network error'))).toBe(false);
  });
});
