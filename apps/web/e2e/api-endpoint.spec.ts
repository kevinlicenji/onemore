import { expect, test } from '@playwright/test';

import { E2E_API_URL } from './test-env';

/**
 * E2E endpoint checks against the live API process (started by Playwright webServer).
 */
test.describe('endpoint: api', () => {
  test('GET /health returns ok', async ({ request }) => {
    const response = await request.get(`${E2E_API_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as { status: string; version: string };
    expect(body.status).toBe('ok');
    expect(body.version).toBeDefined();
  });

  test('GET /api/v1 returns api info', async ({ request }) => {
    const response = await request.get(`${E2E_API_URL}/api/v1`);
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as { message: string };
    expect(body.message).toBe('OneMore API v1');
  });
});
