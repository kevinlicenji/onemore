import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const gitRevision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim();
const revision = gitRevision && gitRevision.length > 0 ? gitRevision : randomUUID();

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E_BYPASS === 'true',
  additionalPrecacheEntries: [
    { url: '/it/offline', revision },
    { url: '/en/offline', revision },
  ],
});

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@onemore/ui', '@onemore/shared', '@onemore/api-client'],
};

const configWithIntl = withNextIntl(nextConfig);
const configWithSerwist = withSerwist(configWithIntl);

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(configWithSerwist, { silent: true })
  : configWithSerwist;
