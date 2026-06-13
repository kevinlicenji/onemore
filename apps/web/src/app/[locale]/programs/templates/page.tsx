'use client';

import type { TemplateSummary } from '@onemore/shared';
import { rankTemplates } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { DifficultyStepsIcon } from '@/components/difficulty-steps-icon';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchProgramTemplates } from '@/lib/api-auth';
import { templateCardTagline, templateCardTitle } from '@/lib/template-card-copy';

export default function ProgramTemplatesPage(): React.ReactElement {
  const t = useTranslations('Programs');
  const { accessToken, profile } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedTemplates = useMemo(() => {
    if (!profile?.onboardingCompletedAt) {
      return templates;
    }

    const ranked = rankTemplates(
      {
        trainingLevel: profile.trainingLevel ?? undefined,
        trainingEnvironment: profile.trainingEnvironment ?? undefined,
        trainingDaysPerWeek: profile.trainingDaysPerWeek ?? undefined,
        preferredSessionMinutes: profile.preferredSessionMinutes ?? undefined,
        preferredMuscleGroups: profile.preferredMuscleGroups,
      },
      templates,
    );

    if (ranked.length === 0) {
      return templates;
    }

    const rankedSlugs = new Set(ranked.map((entry) => entry.template.slug));
    const remainder = templates.filter((template) => !rankedSlugs.has(template.slug));
    return [...ranked.map((entry) => entry.template), ...remainder];
  }, [profile, templates]);

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
            {sortedTemplates.map((template) => (
              <StaggerItem key={template.slug}>
                <Link href={`/${locale}/programs/templates/${template.slug}`}>
                  <Card className="h-full transition-colors hover:bg-muted/30">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-base font-semibold leading-snug">
                          {templateCardTitle(template, locale)}
                        </span>
                        <DifficultyStepsIcon
                          className="shrink-0"
                          level={template.difficultyLevel}
                          size="sm"
                        />
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-snug text-foreground/90">
                        {templateCardTagline(template, locale)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t('templateMetaShort', {
                          days: template.daysPerWeek,
                          minutes: template.estimatedSessionMinutes,
                        })}
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
          <GymMobileActions>
            <Button asChild>
              <Link href={`/${locale}/programs/new`}>{t('buildManual')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/programs`}>{t('backToPrograms')}</Link>
            </Button>
          </GymMobileActions>
        ) : null}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
