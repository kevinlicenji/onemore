'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { applyProgramTemplate, fetchProgramTemplates } from '@/lib/api-auth';
import { trackEvent } from '@/lib/analytics';
import type { TemplateSummary } from '@onemore/shared';

export default function ProgramTemplatesPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
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

  async function handleApply(slug: string): Promise<void> {
    if (!accessToken) {
      return;
    }
    setLoadingSlug(slug);
    setError(null);
    try {
      await applyProgramTemplate(accessToken, slug);
      trackEvent('program_template_selected', { template_id: slug });
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('applyError'));
    } finally {
      setLoadingSlug(null);
    }
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('templatesTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('templatesSubtitle')}</p>
        </div>
        <div className="flex flex-col gap-3">
          {templates.map((template) => (
            <button
              key={template.slug}
              type="button"
              className="rounded-lg border p-4 text-left"
              disabled={loadingSlug !== null}
              onClick={() => {
                void handleApply(template.slug);
              }}
            >
              <span className="font-medium">{template.name}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('templateMeta', {
                  days: template.daysPerWeek,
                  audience: template.audience,
                })}
              </p>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button asChild variant="outline">
          <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
