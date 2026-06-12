'use client';

import type { TemplateSummary } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchProgramTemplates } from '@/lib/api-auth';
import { pickLocalizedText } from '@/lib/pick-localized-text';

export default function ProgramTemplatesPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    void fetchProgramTemplates(accessToken)
      .then(setTemplates)
      .catch(() => {
        setError(t('loadError'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accessToken, t]);

  const headerActions = (
    <Button asChild variant="outline">
      <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
    </Button>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={t('templatesTitle')}
        description={t('templatesSubtitle')}
        actions={isDesktop ? headerActions : undefined}
      >
        {loading ? (
          <CardGridSkeleton count={isDesktop ? 4 : 3} columns="2" />
        ) : (
          <StaggerGroup
            className={isDesktop ? 'grid gap-4 sm:grid-cols-2' : 'flex flex-col gap-3'}
            enabled={isDesktop === true}
          >
            {templates.map((template) => (
              <StaggerItem key={template.slug}>
                <Link href={`/${locale}/programs/templates/${template.slug}`}>
                  <Card className="h-full transition-colors hover:bg-muted/30">
                    <CardContent className="p-6">
                      <span className="font-semibold">
                        {locale === 'it' && template.description
                          ? template.description
                          : template.name}
                      </span>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t('templateMeta', {
                          days: template.daysPerWeek,
                          audience: template.audience,
                        })}
                      </p>
                      {template.guide ? (
                        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                          {pickLocalizedText(template.guide, locale)}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs font-medium text-primary">
                        {t('viewTemplateDetail')}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!isDesktop ? (
          <>
            <Button asChild variant="outline">
              <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/${locale}/programs`}>{t('backToPrograms')}</Link>
            </Button>
          </>
        ) : null}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
