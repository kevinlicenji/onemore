import { execSync } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { E2E_API_URL } from './test-env';

const apiRoot = resolve(fileURLToPath(new URL('../../../services/api', import.meta.url)));
const webRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const standaloneRoot = resolve(webRoot, '.next/standalone');

/**
 * Next.js standalone output omits static assets; copy them like the production Dockerfile.
 */
function syncStandaloneAssets(): void {
  cpSync(resolve(webRoot, '.next/static'), resolve(standaloneRoot, 'apps/web/.next/static'), {
    recursive: true,
  });
  cpSync(resolve(webRoot, 'public'), resolve(standaloneRoot, 'apps/web/public'), {
    recursive: true,
  });
}

/**
 * Ensures DB seed, API dist, and a standalone web build with E2E env before webServer starts.
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

  // Always rebuild web with E2E env — turbo cache may serve a build without NEXT_PUBLIC_* vars.
  execSync('pnpm build', {
    cwd: webRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: E2E_API_URL,
      NEXT_PUBLIC_E2E_BYPASS: 'true',
    },
  });

  syncStandaloneAssets();
}
