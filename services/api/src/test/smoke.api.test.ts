/**
 * Smoke tests — fast checks that critical API paths respond correctly.
 * Run in CI on every PR without external infrastructure.
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import type { Env } from '../config/env.js';
import { createLogger } from '../lib/logger.js';

const smokeEnv: Env = {
  NODE_ENV: 'test',
  API_PORT: 4000,
  DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
  LOG_LEVEL: 'error',
  API_VERSION: '0.1.0-smoke',
};

const app = createApp(smokeEnv, createLogger(smokeEnv));

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
