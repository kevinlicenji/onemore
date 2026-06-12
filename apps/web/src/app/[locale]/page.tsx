import { Button } from '@onemore/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { HomeRedirect } from '@/components/home-redirect';

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
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-between gap-10 p-6 pb-12">
        <div className="flex justify-end">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/${alternateLocale}`}>
              {t('switchLanguage')}: {alternateLocale === 'it' ? 'IT' : 'EN'}
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-6 text-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('tagline')}</p>
          </div>

          <ul className="space-y-3 text-left text-sm text-muted-foreground">
            <li className="rounded-lg border p-3">{t('featurePrograms')}</li>
            <li className="rounded-lg border p-3">{t('featureWorkout')}</li>
            <li className="rounded-lg border p-3">{t('featureProgress')}</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild className="min-h-11 w-full" size="lg">
            <Link href={`/${locale}/register`}>{t('getStarted')}</Link>
          </Button>
          <Button asChild className="min-h-11 w-full" size="lg" variant="outline">
            <Link href={`/${locale}/login`}>{t('login')}</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t('freeForAthletes')}</p>
        </div>
      </main>
    </>
  );
}
