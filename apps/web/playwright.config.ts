import { defineConfig, devices } from '@playwright/test';

import { E2E_API_PORT, E2E_API_URL, E2E_WEB_PORT, E2E_WEB_URL } from './e2e/test-env';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: E2E_WEB_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node dist/index.js',
      cwd: '../../services/api',
      url: `${E2E_API_URL}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        API_PORT: E2E_API_PORT,
        DATABASE_URL:
          process.env.DATABASE_URL ?? 'postgresql://onemore:onemore_dev@localhost:55432/onemore',
        LOG_LEVEL: 'error',
        API_VERSION: '0.1.0-e2e',
        JWT_PRIVATE_KEY_PATH: 'test/fixtures/jwt-private.pem',
        JWT_PUBLIC_KEY_PATH: 'test/fixtures/jwt-public.pem',
        WEB_APP_URL: E2E_WEB_URL,
      },
    },
    {
      command: 'pnpm start',
      url: E2E_WEB_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: E2E_WEB_PORT,
        NEXT_PUBLIC_API_URL: E2E_API_URL,
      },
    },
  ],
});
