import { readFileSync } from 'node:fs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import type { Env } from '../../config/env.js';
import { TEST_JWT_PRIVATE_KEY_PATH, TEST_JWT_PUBLIC_KEY_PATH } from '../../config/test-env.js';
import { prisma } from '../../lib/prisma.js';
import { createLogger } from '../../lib/logger.js';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

function buildEnv(): Env {
  return {
    NODE_ENV: 'test',
    API_PORT: 4000,
    DATABASE_URL:
      process.env.DATABASE_URL ?? 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
    LOG_LEVEL: 'error',
    API_VERSION: '0.1.0-integration',
    WEB_APP_URL: 'http://localhost:3000',
    API_PUBLIC_URL: 'http://localhost:4000',
    EXPORT_STORAGE_PATH: './data/exports-test',
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

const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('integration: auth flows', () => {
  const env = buildEnv();
  const app = createApp(env, createLogger(env), { redis: null });
  const testEmail = `integration-${String(Date.now())}@example.com`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('registers, returns access token, and fetches profile', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'zQ8!mKp2vLn9Wx4rUniq',
        username: `user_${String(Date.now()).slice(-8)}`,
        locale: 'it',
        birthYear: 1995,
        timezone: 'Europe/Rome',
        consents: { tos: true, privacy: true, fitnessData: true },
      });

    expect(registerRes.status).toBe(200);
    const body = registerRes.body as { accessToken: string; user: { id: string } };
    expect(body.accessToken).toBeDefined();

    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${body.accessToken}`);

    expect(meRes.status).toBe(200);
    const meBody = meRes.body as { email: string };
    expect(meBody.email).toBe(testEmail);
  });

  it('logs in with valid credentials', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'zQ8!mKp2vLn9Wx4rUniq' });

    expect(loginRes.status).toBe(200);
    const loginBody = loginRes.body as { accessToken: string };
    expect(loginBody.accessToken).toBeDefined();
  });
});
