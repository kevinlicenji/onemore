'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { RequireAuth } from '@/components/require-auth';

export default function ProgramTemplatesStubPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">{t('templatesStubTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('phase3Coming')}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
