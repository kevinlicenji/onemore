import { getTranslations, setRequestLocale } from 'next-intl/server';

import { HomeRedirect } from '@/components/home-redirect';
import { LandingPageContent } from '@/components/landing-page-content';

/**
 * Public landing page with sign-up and login entry points.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  const alternateLocale = locale === 'it' ? 'en' : 'it';

  return (
    <>
      <HomeRedirect />
      <LandingPageContent
        locale={locale}
        alternateLocale={alternateLocale}
        labels={{
          switchLanguage: t('switchLanguage'),
          title: t('title'),
          tagline: t('tagline'),
          featurePrograms: t('featurePrograms'),
          featureWorkout: t('featureWorkout'),
          featureProgress: t('featureProgress'),
          getStarted: t('getStarted'),
          login: t('login'),
          freeForAthletes: t('freeForAthletes'),
        }}
      />
    </>
  );
}
