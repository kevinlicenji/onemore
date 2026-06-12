'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { fetchProgramTemplates } from '@/lib/api-auth';
import { recommendTemplateSlug } from '@/lib/recommend-template';

export default function ChooseProgramPage(): React.ReactElement {
  const t = useTranslations('Onboarding');
  const { accessToken, profile } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
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
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('chooseProgram.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('chooseProgram.subtitle')}</p>
        </div>

        {recommendedSlug && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <p className="text-sm font-medium">{t('chooseProgram.recommendedTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('chooseProgram.recommendedHint')}
            </p>
            <Button asChild className="mt-3 min-h-11 w-full">
              <Link href={recommendedHref}>{t('chooseProgram.recommendedCta')}</Link>
            </Button>
          </div>
        )}

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
      </main>
    </RequireAuth>
  );
}
