import { defineRouting } from 'next-intl/routing';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@onemore/shared';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});
