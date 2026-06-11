'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';

export default function DashboardPage(): React.ReactElement {
  const t = useTranslations('Dashboard');
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  useEffect(() => {
    if (!isLoading && profile && !profile.onboardingCompletedAt) {
      router.replace(`/${locale}/onboarding`);
    }
  }, [isLoading, profile, locale, router]);

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 p-6 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('emptySubtitle')}</p>
        </div>
        <div className="w-full rounded-lg border border-dashed p-8">
          <p className="text-sm text-muted-foreground">{t('emptyBody')}</p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/workouts/start`}>{t('startWorkoutCta')}</Link>
          </Button>
        </div>
      </main>
    </RequireAuth>
  );
}
