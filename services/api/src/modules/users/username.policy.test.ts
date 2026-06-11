import { describe, expect, it } from 'vitest';

import { HttpError } from '../../lib/errors.js';
import { assertUsernameChangeAllowed, validateUsernameFormat } from './username.policy.js';

describe('validateUsernameFormat', () => {
  it('accepts valid username', () => {
    expect(() => {
      validateUsernameFormat('athlete_1');
    }).not.toThrow();
  });

  it('rejects short username', () => {
    expect(() => {
      validateUsernameFormat('ab');
    }).toThrow(HttpError);
  });
});

describe('assertUsernameChangeAllowed', () => {
  it('allows first change anytime', () => {
    const created = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    expect(() => {
      assertUsernameChangeAllowed(null, created);
    }).not.toThrow();
  });

  it('blocks change within 6 months after prior change', () => {
    const created = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const changed = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(() => {
      assertUsernameChangeAllowed(changed, created);
    }).toThrow(HttpError);
  });
});
