import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function CreditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactElement> {
  const { locale } = await params;
  const t = await getTranslations('Credits');

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-sm text-muted-foreground">{t('wgerAttribution')}</p>
      <p className="mt-2 text-sm">
        <a href="https://wger.de" className="underline" rel="noopener noreferrer" target="_blank">
          wger.de
        </a>
      </p>
      <Link className="mt-6 text-sm underline" href={`/${locale}/dashboard`}>
        {t('back')}
      </Link>
    </main>
  );
}
