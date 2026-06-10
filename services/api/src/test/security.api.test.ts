/**
 * Security smoke tests — lightweight automated checks (not a full pentest).
 * Full pentest is scheduled before public launch per ADR 0008.
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import type { Env } from '../config/env.js';
import { loadEnv } from '../config/env.js';
import { createLogger } from '../lib/logger.js';

const securityEnv: Env = {
  NODE_ENV: 'test',
  API_PORT: 4000,
  DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
  LOG_LEVEL: 'error',
  API_VERSION: '0.1.0-security',
};

const app = createApp(securityEnv, createLogger(securityEnv));

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
  it('rejects production without JWT_SECRET', () => {
    const original = { ...process.env };
    process.env = {
      NODE_ENV: 'production',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
    };

    expect(() => loadEnv()).toThrow('Invalid environment configuration');

    process.env = original;
  });

  it('rejects short JWT_SECRET in production', () => {
    const original = { ...process.env };
    process.env = {
      NODE_ENV: 'production',
      API_PORT: '4000',
      DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
      JWT_SECRET: 'too-short',
    };

    expect(() => loadEnv()).toThrow('Invalid environment configuration');

    process.env = original;
  });
});
