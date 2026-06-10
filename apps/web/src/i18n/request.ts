import type { SupportedLocale } from '@onemore/shared';
import { getRequestConfig } from 'next-intl/server';

import en from '../../messages/en.json';
import it from '../../messages/it.json';
import { routing } from './routing';

const messages: Record<SupportedLocale, typeof en> = {
  en,
  it,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as SupportedLocale)) {
    locale = routing.defaultLocale;
  }

  const resolvedLocale = locale as SupportedLocale;

  return {
    locale: resolvedLocale,
    messages: messages[resolvedLocale],
  };
});
