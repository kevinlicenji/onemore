import { describe, expect, it } from 'vitest';

import {
  isEmailLoginIdentifier,
  loginBodySchema,
  normalizeLoginIdentifier,
  registerBodySchema,
  usernameSchema,
} from './auth.js';

const validRegisterPayload = {
  email: 'athlete@example.com',
  password: 'Str0ng!Pass',
  username: 'athlete42',
  locale: 'it' as const,
  birthYear: 1995,
  timezone: 'Europe/Rome',
  consents: { tos: true as const, privacy: true as const, fitnessData: true as const },
};

describe('loginBodySchema', () => {
  it('accepts email identifier', () => {
    const result = loginBodySchema.parse({
      identifier: 'Athlete@Example.com',
      password: 'secret',
    });
    expect(result.identifier).toBe('Athlete@Example.com');
  });

  it('accepts username identifier', () => {
    const result = loginBodySchema.parse({
      identifier: 'kevin_42',
      password: 'secret',
    });
    expect(result.identifier).toBe('kevin_42');
  });

  it('rejects empty identifier', () => {
    expect(() =>
      loginBodySchema.parse({
        identifier: '   ',
        password: 'secret',
      }),
    ).toThrow();
  });
});

describe('normalizeLoginIdentifier', () => {
  it('lowercases and trims', () => {
    expect(normalizeLoginIdentifier('  Kevin  ')).toBe('kevin');
    expect(normalizeLoginIdentifier(' User@Mail.COM ')).toBe('user@mail.com');
  });
});

describe('isEmailLoginIdentifier', () => {
  it('detects email vs username', () => {
    expect(isEmailLoginIdentifier('user@mail.com')).toBe(true);
    expect(isEmailLoginIdentifier('kevin')).toBe(false);
  });
});

describe('emailSchema via registerBodySchema', () => {
  it('accepts valid email and normalizes case', () => {
    const result = registerBodySchema.parse({
      ...validRegisterPayload,
      email: '  Athlete@Example.COM ',
    });
    expect(result.email).toBe('athlete@example.com');
  });

  it('rejects invalid email format', () => {
    expect(() =>
      registerBodySchema.parse({
        ...validRegisterPayload,
        email: 'not-an-email',
      }),
    ).toThrow();
  });

  it('rejects empty email', () => {
    expect(() =>
      registerBodySchema.parse({
        ...validRegisterPayload,
        email: '   ',
      }),
    ).toThrow();
  });
});

describe('usernameSchema', () => {
  it('rejects @ in username', () => {
    expect(() => usernameSchema.parse('user@name')).toThrow(/cannot contain @/);
  });

  it('rejects email-like username without matching full email rules', () => {
    expect(() => usernameSchema.parse('name@')).toThrow();
  });

  it('accepts alphanumeric username', () => {
    expect(usernameSchema.parse('athlete_42')).toBe('athlete_42');
  });
});
