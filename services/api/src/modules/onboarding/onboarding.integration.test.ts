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

describeIntegration('integration: onboarding flows', () => {
  const env = buildEnv();
  const app = createApp(env, createLogger(env), { redis: null });
  const testEmail = `onboarding-${String(Date.now())}@example.com`;
  let accessToken = '';

  beforeAll(async () => {
    await prisma.$connect();

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'zQ8!mKp2vLn9Wx4rOnboard',
        username: `ob_${String(Date.now()).slice(-8)}`,
        locale: 'it',
        birthYear: 1995,
        timezone: 'Europe/Rome',
        consents: { tos: true, privacy: true, fitnessData: true },
      });

    accessToken = (registerRes.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('saves partial onboarding progress', async () => {
    const patchRes = await request(app)
      .patch('/api/v1/onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ trainingGoal: 'strength' });

    expect(patchRes.status).toBe(200);
    const body = patchRes.body as { trainingGoal: string; onboardingCompletedAt: string | null };
    expect(body.trainingGoal).toBe('strength');
    expect(body.onboardingCompletedAt).toBeNull();
  });

  it('completes onboarding with required fields', async () => {
    const completeRes = await request(app)
      .post('/api/v1/onboarding/complete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        trainingGoal: 'strength',
        trainingLevel: 'beginner',
        trainingEnvironment: 'gym',
        trainingDaysPerWeek: 3,
        motivationLevel: 2,
      });

    expect(completeRes.status).toBe(200);
    const body = completeRes.body as {
      onboardingCompletedAt: string | null;
      motivationLevel: number;
    };
    expect(body.onboardingCompletedAt).not.toBeNull();
    expect(body.motivationLevel).toBe(2);
  });
});
