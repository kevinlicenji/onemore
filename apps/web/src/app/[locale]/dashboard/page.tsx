'use client';

import { Skeleton, cn } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { ActiveWorkoutBanner } from '@/components/active-workout-banner';
import { DashboardMonthlySets } from '@/components/dashboard/dashboard-monthly-sets';
import { DashboardPrMonthBadge } from '@/components/dashboard/dashboard-pr-month-badge';
import { DashboardProgramCta } from '@/components/dashboard/dashboard-program-cta';
import { DashboardVolumeCompare } from '@/components/dashboard/dashboard-volume-compare';
import { DashboardWeekTracker } from '@/components/dashboard/dashboard-week-tracker';
import { GymStatGrid } from '@/components/gym-ui/gym-stat-grid';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { StatGrid } from '@/components/layout/desktop/stat-grid';
import { SyncStatusBadge } from '@/components/sync-status-badge';
import { useDashboardKpis } from '@/hooks/use-dashboard-kpis';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useMotivationalLine } from '@/hooks/use-motivational-line';

export default function DashboardPage(): React.ReactElement {
  const t = useTranslations('Dashboard');
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const { dashboard } = useDashboardKpis(locale);

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
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        href={`/${locale}/programs`}
      >
        {t('pickProgramCta')}
      </Link>
    </div>
  ) : null;

  return (
    <RequireAuth>
      <AdaptivePageShell title={motivationalLine} description={subtitle}>
        <ActiveWorkoutBanner />

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
            <DashboardWeekTracker
              consistency={dashboard.weeklyConsistency}
              streakWeeks={dashboard.streakWeeks}
            />
            <DashboardProgramCta
              locale={locale}
              mobile={!isDesktop}
              navigation={dashboard.programNavigation}
            />
            {isDesktop ? (
              <>
                <DashboardVolumeCompare mobile={false} volume={dashboard.volumeComparison} />
                <StatGrid>
                  <DashboardPrMonthBadge count={dashboard.monthlyStats.personalRecordsCount} />
                  <DashboardMonthlySets count={dashboard.monthlyStats.completedSetsCount} />
                </StatGrid>
              </>
            ) : (
              <>
                <DashboardVolumeCompare mobile volume={dashboard.volumeComparison} />
                <GymStatGrid>
                  <DashboardPrMonthBadge
                    count={dashboard.monthlyStats.personalRecordsCount}
                    mobile
                  />
                  <DashboardMonthlySets count={dashboard.monthlyStats.completedSetsCount} mobile />
                </GymStatGrid>
              </>
            )}
            {!hasActivity ? emptyState : null}
          </div>
        )}

        <SyncStatusBadge />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
