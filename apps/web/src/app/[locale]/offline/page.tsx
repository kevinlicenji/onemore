import { Button } from '@onemore/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

/**
 * Offline fallback page served by the Serwist service worker.
 */
export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Offline');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('body')}</p>
      <Button asChild className="min-h-11">
        <Link href={`/${locale}/dashboard`}>{t('retry')}</Link>
      </Button>
    </main>
  );
}
