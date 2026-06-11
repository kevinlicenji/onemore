import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { E2E_API_URL } from './test-env';

const apiRoot = resolve(fileURLToPath(new URL('../../../services/api', import.meta.url)));
const webRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

/**
 * Ensures DB seed, API dist, and web build with E2E env before Playwright webServer starts.
 */
export default function globalSetup(): void {
  const databaseUrl =
    process.env.DATABASE_URL ?? 'postgresql://onemore:onemore_dev@localhost:55432/onemore';
  execSync('pnpm exec prisma migrate deploy', {
    cwd: apiRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  execSync('pnpm seed', {
    cwd: apiRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  const apiDist = resolve(apiRoot, 'dist/index.js');
  if (!existsSync(apiDist)) {
    execSync('pnpm build', { cwd: apiRoot, stdio: 'inherit' });
  }

  const webBuildId = resolve(webRoot, '.next/BUILD_ID');
  if (process.env.E2E_SKIP_WEB_BUILD !== '1' || !existsSync(webBuildId)) {
    execSync('pnpm build', {
      cwd: webRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        TURBO_FORCE: 'true',
        NEXT_PUBLIC_API_URL: E2E_API_URL,
        NEXT_PUBLIC_E2E_BYPASS: 'true',
      },
    });
  }
}
