'use client';

import type { ProgramDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { ProgramDayList } from '@/components/program-day-list';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchProgramTemplateDetail } from '@/lib/api-auth';
import { pickLocalizedText } from '@/lib/pick-localized-text';

export default function ProgramTemplateDetailPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const isDesktop = useIsDesktop();
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

  const guideText =
    template?.guide !== undefined && template.guide !== null
      ? pickLocalizedText(template.guide, locale)
      : undefined;

  const headerActions = (
    <Button asChild>
      <Link href={`/${locale}/programs/new?template=${encodeURIComponent(slug)}`}>
        {t('customizeTemplate')}
      </Link>
    </Button>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={template?.name ?? t('loadingProgram')}
        description={guideText ?? t('templateDetailSubtitle')}
        actions={isDesktop ? headerActions : undefined}
        variant="wide"
      >
        {template ? (
          <ProgramDayList
            days={template.days}
            locale={locale}
            className={isDesktop ? 'grid grid-cols-1 gap-4 xl:grid-cols-2' : undefined}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{error ?? t('loadingProgram')}</p>
        )}

        {!isDesktop ? (
          <GymMobileActions>
            <Button asChild>
              <Link href={`/${locale}/programs/new?template=${encodeURIComponent(slug)}`}>
                {t('customizeTemplate')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/programs/templates`}>{t('backToTemplates')}</Link>
            </Button>
          </GymMobileActions>
        ) : null}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
