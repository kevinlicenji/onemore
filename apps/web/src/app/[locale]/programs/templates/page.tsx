'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { fetchProgramTemplates } from '@/lib/api-auth';
import type { TemplateSummary } from '@onemore/shared';

export default function ProgramTemplatesPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchProgramTemplates(accessToken)
      .then(setTemplates)
      .catch(() => {
        setError(t('loadError'));
      });
  }, [accessToken, t]);

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('templatesTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('templatesSubtitle')}</p>
        </div>
        <div className="flex flex-col gap-3">
          {templates.map((template) => (
            <Link
              key={template.slug}
              href={`/${locale}/programs/templates/${template.slug}`}
              className="rounded-lg border p-4 hover:bg-muted/30"
            >
              <span className="font-medium">{template.name}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('templateMeta', {
                  days: template.daysPerWeek,
                  audience: template.audience,
                })}
              </p>
              <p className="mt-2 text-xs text-primary">{t('viewTemplateDetail')}</p>
            </Link>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button asChild variant="outline">
          <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/${locale}/programs`}>{t('backToPrograms')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
