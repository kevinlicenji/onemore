import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import type { Env } from './config/env.js';
import { createLogger } from './lib/logger.js';

const testEnv: Env = {
  NODE_ENV: 'test',
  API_PORT: 4000,
  DATABASE_URL: 'postgresql://onemore:onemore_dev@localhost:5432/onemore',
  LOG_LEVEL: 'error',
  API_VERSION: '0.1.0-test',
};

describe('createApp', () => {
  const app = createApp(testEnv, createLogger(testEnv));

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
});
