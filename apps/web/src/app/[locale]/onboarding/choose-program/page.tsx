'use client';

import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchProgramTemplates } from '@/lib/api-auth';
import { recommendTemplateSlug } from '@/lib/recommend-template';

export default function ChooseProgramPage(): React.ReactElement {
  const t = useTranslations('Onboarding');
  const { accessToken, profile } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const [recommendedSlug, setRecommendedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchProgramTemplates(accessToken)
      .then((templates) => {
        const slug = recommendTemplateSlug(
          {
            trainingLevel: profile?.trainingLevel ?? undefined,
            trainingEnvironment: profile?.trainingEnvironment ?? undefined,
            trainingDaysPerWeek: profile?.trainingDaysPerWeek ?? undefined,
          },
          templates,
        );
        setRecommendedSlug(slug);
      })
      .catch(() => {
        setRecommendedSlug(null);
      });
  }, [accessToken, profile]);

  const recommendedHref = useMemo(() => {
    if (!recommendedSlug) {
      return `/${locale}/programs/templates`;
    }
    return `/${locale}/programs/templates/${recommendedSlug}`;
  }, [locale, recommendedSlug]);

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={t('chooseProgram.title')}
        description={t('chooseProgram.subtitle')}
        variant={isDesktop ? 'default' : 'centered'}
      >
        <div className={isDesktop ? 'grid max-w-3xl gap-4' : 'flex flex-col gap-4'}>
          {recommendedSlug ? (
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-6">
                <p className="font-medium">{t('chooseProgram.recommendedTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('chooseProgram.recommendedHint')}
                </p>
                <Button asChild className="mt-4">
                  <Link href={recommendedHref}>{t('chooseProgram.recommendedCta')}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Button
            asChild
            className="h-auto min-h-11 py-4"
            variant={recommendedSlug ? 'outline' : 'default'}
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
