import { afterEach, describe, expect, it } from 'vitest';

import { TEST_JWT_PRIVATE_KEY_PATH, TEST_JWT_PUBLIC_KEY_PATH } from './test-env.js';
import { loadEnv } from './env.js';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('loadEnv', () => {
  it('parses valid environment with JWT key paths', () => {
    process.env = {
      NODE_ENV: 'test',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
      JWT_PRIVATE_KEY_PATH: TEST_JWT_PRIVATE_KEY_PATH,
      JWT_PUBLIC_KEY_PATH: TEST_JWT_PUBLIC_KEY_PATH,
    };

    const env = loadEnv();
    expect(env.API_PORT).toBe(4000);
    expect(env.jwtPrivateKeyPem).toContain('BEGIN PRIVATE KEY');
  });

  it('throws on missing DATABASE_URL', () => {
    process.env = {
      NODE_ENV: 'test',
      API_PORT: '4000',
      JWT_PRIVATE_KEY_PATH: TEST_JWT_PRIVATE_KEY_PATH,
      JWT_PUBLIC_KEY_PATH: TEST_JWT_PUBLIC_KEY_PATH,
    };

    expect(() => loadEnv()).toThrow('Invalid environment configuration');
  });

  it('treats empty optional URLs as unset', () => {
    process.env = {
      NODE_ENV: 'test',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
      JWT_PRIVATE_KEY_PATH: TEST_JWT_PRIVATE_KEY_PATH,
      JWT_PUBLIC_KEY_PATH: TEST_JWT_PUBLIC_KEY_PATH,
      SENTRY_DSN: '',
      REDIS_URL: '',
    };

    const env = loadEnv();
    expect(env.SENTRY_DSN).toBeUndefined();
    expect(env.REDIS_URL).toBeUndefined();
  });

  it('throws when JWT keys are missing', () => {
    process.env = {
      NODE_ENV: 'test',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
    };

    expect(() => loadEnv()).toThrow('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY');
  });
});
