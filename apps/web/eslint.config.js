import nextConfig from '@onemore/eslint-config/next';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
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
