import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@onemore/ui', '@onemore/shared', '@onemore/api-client'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

const configWithIntl = withNextIntl(nextConfig);

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(configWithIntl, { silent: true })
  : configWithIntl;
