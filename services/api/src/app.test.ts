import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import type { Env } from './config/env.js';
import { TEST_JWT_PRIVATE_KEY_PATH, TEST_JWT_PUBLIC_KEY_PATH } from './config/test-env.js';
import { createLogger } from './lib/logger.js';

const testEnv: Env = {
  NODE_ENV: 'test',
  API_PORT: 4000,
  DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
  LOG_LEVEL: 'error',
  API_VERSION: '0.1.0-test',
  WEB_APP_URL: 'http://localhost:3000',
  API_PUBLIC_URL: 'http://localhost:4000',
  EXPORT_STORAGE_PATH: './data/exports-test',
  REFRESH_COOKIE_NAME: 'onemore_refresh',
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_DAYS: 7,
  CONSENT_VERSION_TOS: 'tos-2026-01',
  CONSENT_VERSION_PRIVACY: 'privacy-2026-01',
  CONSENT_VERSION_FITNESS: 'fitness-2026-01',
  jwtPrivateKeyPem: '',
  jwtPublicKeyPem: '',
  JWT_PRIVATE_KEY_PATH: TEST_JWT_PRIVATE_KEY_PATH,
  JWT_PUBLIC_KEY_PATH: TEST_JWT_PUBLIC_KEY_PATH,
};

// loadEnv merges paths — for app tests load keys manually
import { readFileSync } from 'node:fs';
testEnv.jwtPrivateKeyPem = readFileSync(TEST_JWT_PRIVATE_KEY_PATH, 'utf8');
testEnv.jwtPublicKeyPem = readFileSync(TEST_JWT_PUBLIC_KEY_PATH, 'utf8');

describe('integration: api endpoints', () => {
  const app = createApp(testEnv, createLogger(testEnv), { redis: null });

  it('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    const body = response.body as { status: string; version: string; timestamp: string };
    expect(body).toMatchObject({
      status: 'ok',
      version: '0.1.0-test',
    });
    expect(body.timestamp).toBeDefined();
  });

  it('GET /api/v1 returns API info', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.status).toBe(200);
    const body = response.body as { message: string };
    expect(body.message).toBe('OneMore API v1');
  });

  it('GET /api/v1/users/me without token returns 401', async () => {
    const response = await request(app).get('/api/v1/users/me');
    expect(response.status).toBe(401);
  });
});
