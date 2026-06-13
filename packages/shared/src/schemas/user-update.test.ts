import { describe, expect, it } from 'vitest';

import { changePasswordBodySchema, updateUserProfileSchema } from './user-update.js';

describe('updateUserProfileSchema', () => {
  it('accepts personal info fields', () => {
    const parsed = updateUserProfileSchema.parse({
      firstName: 'Marco',
      lastName: 'Rossi',
      email: 'Marco@Example.com',
    });
    expect(parsed.email).toBe('marco@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => updateUserProfileSchema.parse({ email: 'not-an-email' })).toThrow();
  });
});

describe('changePasswordBodySchema', () => {
  it('requires current and new password', () => {
    const parsed = changePasswordBodySchema.parse({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    expect(parsed.newPassword).toBe('new-password');
  });

  it('rejects short new password', () => {
    expect(() =>
      changePasswordBodySchema.parse({
        currentPassword: 'old-password',
        newPassword: 'short',
      }),
    ).toThrow();
  });
});
