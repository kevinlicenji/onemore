'use client';

import type { TemplateSummary } from '@onemore/shared';
import { rankTemplates } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useMotivationalLine } from '@/hooks/use-motivational-line';
import { fetchProgramTemplates } from '@/lib/api-auth';
import { pickLocalizedText } from '@/lib/pick-localized-text';

export default function ChooseProgramPage(): React.ReactElement {
  const t = useTranslations('Onboarding');
  const programsT = useTranslations('Programs');
  const { accessToken, profile } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const motivationalLine = useMotivationalLine('chooseProgram', profile);
  const [rankedTemplates, setRankedTemplates] = useState<TemplateSummary[]>([]);

  useEffect(() => {
    if (!accessToken || !profile) {
      return;
    }
    void fetchProgramTemplates(accessToken)
      .then((templates) => {
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
        setRankedTemplates(ranked.map((entry) => entry.template));
      })
      .catch(() => {
        setRankedTemplates([]);
      });
  }, [accessToken, profile]);

  const topTemplate = rankedTemplates[0] ?? null;
  const recommendedHref = useMemo(() => {
    if (!topTemplate) {
      return `/${locale}/programs/templates`;
    }
    return `/${locale}/programs/templates/${topTemplate.slug}`;
  }, [locale, topTemplate]);

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={t('chooseProgram.title')}
        description={motivationalLine}
        variant={isDesktop ? 'default' : 'centered'}
      >
        <div className={isDesktop ? 'grid max-w-3xl gap-4' : 'flex flex-col gap-4'}>
          {topTemplate ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-6">
                <p className="font-medium">{t('chooseProgram.recommendedTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('chooseProgram.recommendedHint')}
                </p>
                <p className="mt-3 font-semibold">
                  {locale === 'it' && topTemplate.description
                    ? topTemplate.description
                    : topTemplate.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {programsT('templateMeta', {
                    days: topTemplate.daysPerWeek,
                    audience: topTemplate.audience,
                  })}
                  {' · '}
                  {t('chooseProgram.sessionEstimate', {
                    minutes: topTemplate.estimatedSessionMinutes,
                  })}
                </p>
                <Button asChild className="mt-4">
                  <Link href={recommendedHref}>{t('chooseProgram.recommendedCta')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {rankedTemplates.length > 1 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t('chooseProgram.alsoFitsTitle')}</p>
              {rankedTemplates.slice(1, 4).map((template) => (
                <Button
                  key={template.slug}
                  asChild
                  className="h-auto min-h-11 py-3"
                  variant="outline"
                >
                  <Link href={`/${locale}/programs/templates/${template.slug}`}>
                    <span className="block font-medium">
                      {locale === 'it' && template.description
                        ? template.description
                        : template.name}
                    </span>
                    <span className="block text-sm font-normal opacity-80">
                      {programsT('templateMeta', {
                        days: template.daysPerWeek,
                        audience: template.audience,
                      })}
                      {' · '}
                      {t('chooseProgram.sessionEstimate', {
                        minutes: template.estimatedSessionMinutes,
                      })}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}

          <Button
            asChild
            className="h-auto min-h-11 py-4"
            variant={topTemplate ? 'outline' : 'default'}
          >
            <Link href={`/${locale}/programs/templates`}>
              <span className="block font-medium">{t('chooseProgram.templateTitle')}</span>
              <span className="block text-sm font-normal opacity-80">
                {t('chooseProgram.templateDescription')}
              </span>
            </Link>
          </Button>
          <Button asChild className="h-auto min-h-11 py-4" variant="outline">
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
        </div>
      </AdaptivePageShell>
    </RequireAuth>
  );
}
