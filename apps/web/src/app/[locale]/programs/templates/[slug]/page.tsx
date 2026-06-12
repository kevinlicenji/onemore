'use client';

import type { ProgramDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { ProgramDayList } from '@/components/program-day-list';
import { RequireAuth } from '@/components/require-auth';
import { fetchProgramTemplateDetail } from '@/lib/api-auth';

export default function ProgramTemplateDetailPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [template, setTemplate] = useState<ProgramDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !slug) {
      return;
    }
    void fetchProgramTemplateDetail(accessToken, slug)
      .then(setTemplate)
      .catch(() => {
        setError(t('templateDetailError'));
      });
  }, [accessToken, slug, t]);

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
        {template ? (
          <>
            <div>
              <h1 className="text-2xl font-bold">{template.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('templateDetailSubtitle')}</p>
            </div>
            <ProgramDayList days={template.days} locale={locale} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{error ?? t('loadingProgram')}</p>
        )}

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href={`/${locale}/programs/new?template=${encodeURIComponent(slug)}`}>
              {t('customizeTemplate')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/programs/templates`}>{t('backToTemplates')}</Link>
          </Button>
        </div>
      </main>
    </RequireAuth>
  );
}
