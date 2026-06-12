import { Button } from '@onemore/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { OfflineResumeCta } from '@/components/offline-resume-cta';

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center lg:max-w-lg lg:gap-6 lg:p-12">
      <h1 className="text-2xl font-bold lg:text-title">{t('title')}</h1>
      <p className="text-sm text-muted-foreground lg:text-base">{t('body')}</p>
      <div className="flex w-full flex-col gap-3">
        <OfflineResumeCta locale={locale} />
        <Button asChild className="min-h-11 lg:min-h-12" variant="outline">
          <Link href={`/${locale}/dashboard`}>{t('retry')}</Link>
        </Button>
      </div>
    </main>
  );
}
