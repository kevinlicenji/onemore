import nextConfig from '@onemore/eslint-config/next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'e2e/**',
      'playwright.config.ts',
      '.next/**',
      'next-env.d.ts',
      'eslint.config.js',
      'next.config.ts',
      'postcss.config.mjs',
      'tailwind.config.ts',
    ],
  },
  ...nextConfig,
];
