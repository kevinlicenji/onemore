'use client';

import type { TodaySupplementsResponse, UserExerciseMaxWithExercise } from '@onemore/shared';
import { Skeleton, cn } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { DashboardMaxValues } from '@/components/dashboard/dashboard-max-values';
import { DashboardMonthlySets } from '@/components/dashboard/dashboard-monthly-sets';
import { DashboardPrMonthBadge } from '@/components/dashboard/dashboard-pr-month-badge';
import { DashboardProgramCta } from '@/components/dashboard/dashboard-program-cta';
import { DashboardRecentPrs } from '@/components/dashboard/dashboard-recent-prs';
import { DashboardSupplementsToday } from '@/components/dashboard/dashboard-supplements-today';
import { DashboardVolumeCompare } from '@/components/dashboard/dashboard-volume-compare';
import { DashboardWeekTracker } from '@/components/dashboard/dashboard-week-tracker';
import { GymStatGrid } from '@/components/gym-ui/gym-stat-grid';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { StatGrid } from '@/components/layout/desktop/stat-grid';
import { SyncStatusBadge } from '@/components/sync-status-badge';
import { useActiveWorkoutSession } from '@/hooks/use-active-workout-session';
import { useDashboardKpis } from '@/hooks/use-dashboard-kpis';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useMotivationalLine } from '@/hooks/use-motivational-line';
import { fetchMaxValues, fetchPendingMaxValues, fetchTodaySupplements } from '@/lib/api-auth';

export default function DashboardPage(): React.ReactElement {
  const t = useTranslations('Dashboard');
  const { profile, isLoading, accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const { dashboard, refresh } = useDashboardKpis(locale);
  const { session: activeWorkoutSession } = useActiveWorkoutSession();
  const timezone = profile?.timezone ?? 'Europe/Rome';

  const [todaySupplements, setTodaySupplements] = useState<TodaySupplementsResponse | null>(null);
  const [supplementsLoading, setSupplementsLoading] = useState(true);
  const [supplementsError, setSupplementsError] = useState<string | null>(null);
  const [maxValues, setMaxValues] = useState<UserExerciseMaxWithExercise[]>([]);
  const [pendingMaxCount, setPendingMaxCount] = useState(0);
  const [maxValuesError, setMaxValuesError] = useState<string | null>(null);

  const loadSupplementsAndMaxes = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }

    setSupplementsLoading(true);
    setSupplementsError(null);
    await fetchTodaySupplements(accessToken, locale, timezone)
      .then(setTodaySupplements)
      .catch((err: unknown) => {
        setSupplementsError(err instanceof Error ? err.message : t('loadError'));
      })
      .finally(() => {
        setSupplementsLoading(false);
      });

    await Promise.all([fetchMaxValues(accessToken), fetchPendingMaxValues(accessToken)])
      .then(([active, pending]) => {
        setMaxValues(active);
        setPendingMaxCount(pending.length);
        setMaxValuesError(null);
      })
      .catch((err: unknown) => {
        setMaxValuesError(err instanceof Error ? err.message : t('loadError'));
      });
  }, [accessToken, locale, t, timezone]);

  useEffect(() => {
    void loadSupplementsAndMaxes();
  }, [loadSupplementsAndMaxes]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    await refresh();
    await loadSupplementsAndMaxes();
  }, [loadSupplementsAndMaxes, refresh]);

  useEffect(() => {
    if (!isLoading && profile && !profile.onboardingCompletedAt) {
      router.replace(`/${locale}/onboarding`);
    }
  }, [isLoading, profile, locale, router]);

  const hasActivity =
    dashboard !== null &&
    (dashboard.lastWorkout !== null ||
      dashboard.streakWeeks > 0 ||
      dashboard.weeklyConsistency.workoutsCompleted > 0 ||
      dashboard.monthlyStats.completedSetsCount > 0);

  const motivationalLine = useMotivationalLine(
    hasActivity ? 'dashboardActive' : 'dashboardEmpty',
    profile,
  );
  const subtitle = hasActivity ? t('subtitle') : t('emptySubtitle');

  const emptyState = !hasActivity ? (
    <div className="rounded-2xl border border-dashed border-gym-separator p-6 text-center">
      <p className="text-sm text-muted-foreground">{t('emptyBody')}</p>
      <Link
        className="mt-4 inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        href={`/${locale}/programs`}
      >
        {t('pickProgramCta')}
      </Link>
    </div>
  ) : null;

  const supplementsCard = (
    <DashboardSupplementsToday
      error={supplementsError}
      loading={supplementsLoading}
      locale={locale}
      logs={todaySupplements?.logs ?? []}
      mobile={!isDesktop}
      totalCount={todaySupplements?.totalCount ?? 0}
    />
  );

  const maxValuesCard = (
    <DashboardMaxValues
      locale={locale}
      maxValues={maxValues}
      mobile={!isDesktop}
      pendingCount={pendingMaxCount}
    />
  );

  const programCta =
    dashboard !== null ? (
      <DashboardProgramCta
        activeSessionId={activeWorkoutSession?.id ?? null}
        locale={locale}
        mobile={!isDesktop}
        navigation={dashboard.programNavigation}
      />
    ) : null;

  const mobileActiveContent =
    dashboard !== null && hasActivity ? (
      <>
        {programCta}
        <DashboardWeekTracker
          consistency={dashboard.weeklyConsistency}
          streakWeeks={dashboard.streakWeeks}
        />
        <DashboardRecentPrs locale={locale} mobile records={dashboard.recentPersonalRecords} />
        {supplementsCard}
        <GymStatGrid>
          <DashboardPrMonthBadge count={dashboard.monthlyStats.personalRecordsCount} mobile />
          <DashboardMonthlySets count={dashboard.monthlyStats.completedSetsCount} mobile />
        </GymStatGrid>
        <DashboardVolumeCompare mobile volume={dashboard.volumeComparison} />
        {maxValuesCard}
        {maxValuesError ? <p className="text-sm text-destructive">{maxValuesError}</p> : null}
      </>
    ) : null;

  const mobileNewUserContent =
    dashboard !== null && !hasActivity ? (
      <>
        {programCta}
        {emptyState}
      </>
    ) : null;

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={motivationalLine}
        description={subtitle}
        onRefresh={isDesktop ? undefined : handleRefresh}
      >
        {!dashboard ? (
          isDesktop ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-36 rounded-lg" />
              <Skeleton className="h-40 rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <GymStatGrid>
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </GymStatGrid>
            </div>
          )
        ) : (
          <div className={cn('flex flex-col', isDesktop ? 'gap-4' : 'gap-3')}>
            {isDesktop ? (
              <>
                <DashboardWeekTracker
                  consistency={dashboard.weeklyConsistency}
                  streakWeeks={dashboard.streakWeeks}
                />
                {programCta}
                <DashboardVolumeCompare mobile={false} volume={dashboard.volumeComparison} />
                <StatGrid>
                  <DashboardPrMonthBadge count={dashboard.monthlyStats.personalRecordsCount} />
                  <DashboardMonthlySets count={dashboard.monthlyStats.completedSetsCount} />
                </StatGrid>
                <div className="grid gap-4 lg:grid-cols-2">
                  {supplementsCard}
                  {maxValuesCard}
                </div>
                {maxValuesError ? (
                  <p className="text-sm text-destructive">{maxValuesError}</p>
                ) : null}
                <DashboardRecentPrs locale={locale} records={dashboard.recentPersonalRecords} />
              </>
            ) : (
              (mobileNewUserContent ?? mobileActiveContent)
            )}
          </div>
        )}

        <div className="mt-4">
          <SyncStatusBadge />
        </div>
      </AdaptivePageShell>
    </RequireAuth>
  );
}
