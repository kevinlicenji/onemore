/**
 * Security smoke tests — lightweight automated checks (not a full pentest).
 */
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import type { Env } from '../config/env.js';
import { TEST_JWT_PRIVATE_KEY_PATH, TEST_JWT_PUBLIC_KEY_PATH } from '../config/test-env.js';
import { loadEnv } from '../config/env.js';
import { createLogger } from '../lib/logger.js';

function buildTestEnv(): Env {
  return {
    NODE_ENV: 'test',
    API_PORT: 4000,
    DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
    LOG_LEVEL: 'error',
    API_VERSION: '0.1.0-security',
    WEB_APP_URL: 'http://localhost:3000',
    API_PUBLIC_URL: 'http://localhost:4000',
    REFRESH_COOKIE_NAME: 'onemore_refresh',
    ACCESS_TOKEN_TTL_SECONDS: 900,
    REFRESH_TOKEN_TTL_DAYS: 7,
    CONSENT_VERSION_TOS: 'tos-2026-01',
    CONSENT_VERSION_PRIVACY: 'privacy-2026-01',
    CONSENT_VERSION_FITNESS: 'fitness-2026-01',
    jwtPrivateKeyPem: readFileSync(TEST_JWT_PRIVATE_KEY_PATH, 'utf8'),
    jwtPublicKeyPem: readFileSync(TEST_JWT_PUBLIC_KEY_PATH, 'utf8'),
  };
}

const app = createApp(buildTestEnv(), createLogger(buildTestEnv()), { redis: null });

describe('security smoke: api headers', () => {
  it('sets X-Content-Type-Options nosniff via helmet', async () => {
    const response = await request(app).get('/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('does not expose server technology stack in health body', async () => {
    const response = await request(app).get('/health');
    const body = JSON.stringify(response.body);
    expect(body).not.toMatch(/password|secret|token_hash/i);
    expect(body).not.toContain('stack');
  });
});

describe('security smoke: environment validation', () => {
  it('throws when JWT keys are missing', () => {
    const original = { ...process.env };
    process.env = {
      NODE_ENV: 'production',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
    };

    expect(() => loadEnv()).toThrow('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY');

    process.env = original;
  });
});
