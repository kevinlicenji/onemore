'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { RequireAuth } from '@/components/require-auth';

export default function ChooseProgramPage(): React.ReactElement {
  const t = useTranslations('Onboarding');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('chooseProgram.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('chooseProgram.subtitle')}</p>
        </div>
        <Button asChild className="h-auto py-4">
          <Link href={`/${locale}/programs/templates`}>
            <span className="block font-medium">{t('chooseProgram.templateTitle')}</span>
            <span className="block text-sm font-normal opacity-80">
              {t('chooseProgram.templateDescription')}
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href={`/${locale}/programs/new`}>
            <span className="block font-medium">{t('chooseProgram.manualTitle')}</span>
            <span className="block text-sm font-normal opacity-80">
              {t('chooseProgram.manualDescription')}
            </span>
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/${locale}/dashboard`}>{t('chooseProgram.skipToDashboard')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
