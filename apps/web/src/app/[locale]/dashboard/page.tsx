'use client';

import type { AnalyticsDashboard } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { ActiveWorkoutBanner } from '@/components/active-workout-banner';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { SyncStatusBadge } from '@/components/sync-status-badge';
import { fetchAnalyticsDashboard } from '@/lib/api-auth';

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

export default function DashboardPage(): React.ReactElement {
  const t = useTranslations('Dashboard');
  const tProgress = useTranslations('Progress');
  const { profile, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    try {
      const data = await fetchAnalyticsDashboard(accessToken);
      setDashboard(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('loadError'));
    }
  }, [accessToken, t]);

  useEffect(() => {
    if (!isLoading && profile && !profile.onboardingCompletedAt) {
      router.replace(`/${locale}/onboarding`);
    }
  }, [isLoading, profile, locale, router]);

  useEffect(() => {
    if (accessToken && profile?.onboardingCompletedAt) {
      void loadDashboard();
    }
  }, [accessToken, profile?.onboardingCompletedAt, loadDashboard]);

  const hasActivity =
    dashboard !== null &&
    (dashboard.lastWorkout !== null ||
      dashboard.streakWeeks > 0 ||
      dashboard.recentPersonalRecords.length > 0);

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {hasActivity ? t('subtitle') : t('emptySubtitle')}
          </p>
        </div>

        {loadError && <p className="text-sm text-red-600">{loadError}</p>}

        <ActiveWorkoutBanner />

        {dashboard && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{t('streakLabel')}</p>
              <p className="text-2xl font-bold">{dashboard.streakWeeks}</p>
              <p className="text-xs text-muted-foreground">{t('streakUnit')}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{t('weeklyVolumeLabel')}</p>
              <p className="text-2xl font-bold">{dashboard.weeklyVolumeKg}</p>
              <p className="text-xs text-muted-foreground">kg</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{t('workoutsThisWeekLabel')}</p>
              <p className="text-2xl font-bold">{dashboard.workoutsThisWeek}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{t('lastWorkoutLabel')}</p>
              <p className="text-sm font-medium">
                {dashboard.lastWorkout
                  ? formatDate(dashboard.lastWorkout.completedAt, locale)
                  : t('noLastWorkout')}
              </p>
            </div>
          </div>
        )}

        {dashboard?.nextWorkout.hasActiveAssignment && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{t('nextWorkoutLabel')}</p>
            <p className="text-sm text-muted-foreground">
              {dashboard.nextWorkout.workoutDayLabel ?? t('nextWorkoutFallback')}
              {' · '}
              {t('nextWorkoutMeta', { count: dashboard.nextWorkout.exerciseCount })}
            </p>
            <Button asChild className="mt-3" size="sm">
              <Link href={`/${locale}/workouts/start`}>{t('startWorkoutCta')}</Link>
            </Button>
          </div>
        )}

        {dashboard && dashboard.recentPersonalRecords.length > 0 && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{t('recentPrsLabel')}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {dashboard.recentPersonalRecords.map((record) => (
                <li key={record.id} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{record.exerciseName}</span>
                  {' · '}
                  {tProgress(`prType_${record.prType}`)} {record.value}
                  {record.prType === 'weight_pr' && record.reps !== null
                    ? ` × ${String(record.reps)}`
                    : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hasActivity && !dashboard?.nextWorkout.hasActiveAssignment && (
          <div className="w-full rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">{t('emptyBody')}</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}/programs`}>{t('pickProgramCta')}</Link>
            </Button>
          </div>
        )}

        {!dashboard?.nextWorkout.hasActiveAssignment && hasActivity && (
          <Button asChild>
            <Link href={`/${locale}/workouts/start`}>{t('startWorkoutCta')}</Link>
          </Button>
        )}

        <PwaInstallPrompt />

        <SyncStatusBadge />
        <Link className="text-xs text-muted-foreground underline" href={`/${locale}/credits`}>
          {t('creditsLink')}
        </Link>
      </main>
    </RequireAuth>
  );
}
