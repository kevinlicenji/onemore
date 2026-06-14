'use client';

import { SUPPORTED_LOCALES, type SupportedLocale } from '@onemore/shared';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { switchLocalePath } from '@/lib/switch-locale-path';

const LOCALE_LABEL_KEYS: Record<SupportedLocale, 'languageItalian' | 'languageEnglish'> = {
  it: 'languageItalian',
  en: 'languageEnglish',
};

/**
 * In-app language picker that preserves the current route when switching locale.
 */
export function LocaleSwitcher(): React.ReactElement {
  const t = useTranslations('Settings');
  const params = useParams();
  const pathname = usePathname();
  const currentLocale =
    typeof params.locale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(params.locale)
      ? (params.locale as SupportedLocale)
      : 'it';

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t('languageLabel')}</span>
      <GymListGroup>
        {SUPPORTED_LOCALES.map((locale) => {
          const href = switchLocalePath(pathname, locale);
          const isActive = locale === currentLocale;
          return (
            <GymListRow
              key={locale}
              active={isActive}
              href={href}
              showChevron={false}
              title={t(LOCALE_LABEL_KEYS[locale])}
              trailing={
                isActive ? (
                  <span aria-hidden className="pr-4 text-primary">
                    ✓
                  </span>
                ) : null
              }
            />
          );
        })}
      </GymListGroup>
    </div>
  );
}
