import { ApiClient } from '@onemore/api-client';
import { Button } from '@onemore/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Home page — Phase 0 demo with API health check and locale switch.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  let apiStatus: 'ok' | 'error' = 'error';
  let apiVersion: string | undefined;

  try {
    const client = new ApiClient({ baseUrl: apiBaseUrl });
    const health = await client.getHealth();
    apiStatus = health.status;
    apiVersion = health.version;
  } catch {
    apiStatus = 'error';
  }

  const alternateLocale = locale === 'it' ? 'en' : 'it';

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="w-full rounded-lg border p-4">
        <p className="text-sm font-medium">{t('apiStatus')}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {apiStatus === 'ok'
            ? `${t('apiConnected')} (v${apiVersion ?? 'unknown'})`
            : t('apiError')}
        </p>
      </div>

      <Button asChild variant="outline">
        <Link href={`/${alternateLocale}`}>
          {t('switchLanguage')}: {alternateLocale === 'it' ? 'Italiano' : 'English'}
        </Link>
      </Button>
    </main>
  );
}
