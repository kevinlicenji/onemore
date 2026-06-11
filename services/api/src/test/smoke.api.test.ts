/**
 * Smoke tests — fast checks that critical API paths respond correctly.
 */
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import type { Env } from '../config/env.js';
import { TEST_JWT_PRIVATE_KEY_PATH, TEST_JWT_PUBLIC_KEY_PATH } from '../config/test-env.js';
import { createLogger } from '../lib/logger.js';

const smokeEnv: Env = {
  NODE_ENV: 'test',
  API_PORT: 4000,
  DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
  LOG_LEVEL: 'error',
  API_VERSION: '0.1.0-smoke',
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

const app = createApp(smokeEnv, createLogger(smokeEnv), { redis: null });

describe('smoke: api', () => {
  it('GET /health returns 200 with ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });

  it('GET /api/v1 is reachable', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.status).toBe(200);
  });

  it('unknown routes return 404', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
  });
});
