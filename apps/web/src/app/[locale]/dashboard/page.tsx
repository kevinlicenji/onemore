'use client';

import type { AnalyticsDashboard } from '@onemore/shared';
import { Button, Card, CardContent, Skeleton } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { ActiveWorkoutBanner } from '@/components/active-workout-banner';
import { GymStatGrid } from '@/components/gym-ui/gym-stat-grid';
import { GymStatTile } from '@/components/gym-ui/gym-stat-tile';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { StatGrid } from '@/components/layout/desktop/stat-grid';
import { SyncStatusBadge } from '@/components/sync-status-badge';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchAnalyticsDashboard } from '@/lib/api-auth';
import { useMotivationalLine } from '@/hooks/use-motivational-line';

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

interface DashboardStatsProps {
  dashboard: AnalyticsDashboard;
  locale: string;
  mobile?: boolean;
}

function DashboardStats({
  dashboard,
  locale,
  mobile = false,
}: DashboardStatsProps): React.ReactElement {
  const t = useTranslations('Dashboard');

  if (mobile) {
    return (
      <GymStatGrid>
        <GymStatTile
          label={t('streakLabel')}
          unit={t('streakUnit')}
          value={dashboard.streakWeeks}
        />
        <GymStatTile label={t('weeklyVolumeLabel')} unit="kg" value={dashboard.weeklyVolumeKg} />
        <GymStatTile label={t('workoutsThisWeekLabel')} value={dashboard.workoutsThisWeek} />
        <GymStatTile
          label={t('lastWorkoutLabel')}
          value={
            dashboard.lastWorkout
              ? formatDate(dashboard.lastWorkout.completedAt, locale)
              : t('noLastWorkout')
          }
        />
      </GymStatGrid>
    );
  }

  return (
    <StatGrid>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{t('streakLabel')}</p>
          <p className="mt-2 text-3xl font-bold">{dashboard.streakWeeks}</p>
          <p className="text-sm text-muted-foreground">{t('streakUnit')}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{t('weeklyVolumeLabel')}</p>
          <p className="mt-2 text-3xl font-bold">{dashboard.weeklyVolumeKg}</p>
          <p className="text-sm text-muted-foreground">kg</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{t('workoutsThisWeekLabel')}</p>
          <p className="mt-2 text-3xl font-bold">{dashboard.workoutsThisWeek}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{t('lastWorkoutLabel')}</p>
          <p className="mt-2 text-lg font-semibold">
            {dashboard.lastWorkout
              ? formatDate(dashboard.lastWorkout.completedAt, locale)
              : t('noLastWorkout')}
          </p>
        </CardContent>
      </Card>
    </StatGrid>
  );
}

export default function DashboardPage(): React.ReactElement {
  const t = useTranslations('Dashboard');
  const { profile, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    try {
      const data = await fetchAnalyticsDashboard(accessToken);
      setDashboard(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
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
    dashboard !== null && (dashboard.lastWorkout !== null || dashboard.streakWeeks > 0);

  const motivationalLine = useMotivationalLine(
    hasActivity ? 'dashboardActive' : 'dashboardEmpty',
    profile,
  );
  const subtitle = hasActivity ? t('subtitle') : t('emptySubtitle');

  const startWorkoutButton = (
    <Button asChild className={isDesktop ? undefined : 'min-h-12 w-full text-base'}>
      <Link href={`/${locale}/workouts/start`}>{t('startWorkoutCta')}</Link>
    </Button>
  );

  const emptyState = !hasActivity ? (
    isDesktop ? (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('emptyBody')}</p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/programs`}>{t('pickProgramCta')}</Link>
          </Button>
        </CardContent>
      </Card>
    ) : null
  ) : null;

  return (
    <RequireAuth>
      <AdaptivePageShell
        title={motivationalLine}
        description={subtitle}
        actions={isDesktop ? startWorkoutButton : undefined}
      >
        {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
        <ActiveWorkoutBanner />

        {!isDesktop && dashboard ? (
          <div className="flex flex-col gap-3">
            {startWorkoutButton}
            {!hasActivity ? (
              <Button asChild className="min-h-11 w-full" variant="outline">
                <Link href={`/${locale}/programs`}>{t('pickProgramCta')}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        {loading && !dashboard ? (
          isDesktop ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
            </div>
          ) : (
            <GymStatGrid>
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </GymStatGrid>
          )
        ) : null}

        {dashboard ? (
          <DashboardStats dashboard={dashboard} locale={locale} mobile={isDesktop === false} />
        ) : null}

        {emptyState}
        <SyncStatusBadge />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
