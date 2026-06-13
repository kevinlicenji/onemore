'use client';

import type { AnalyticsDashboard } from '@onemore/shared';
import { Button, Card, CardContent, Skeleton, cn } from '@onemore/ui';
import { CalendarDays, Dumbbell, Flame, Layers, TrendingUp } from 'lucide-react';
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

function formatVolume(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}k`;
  }
  return String(Math.round(kg));
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
  const lastWorkoutLabel = dashboard.lastWorkout
    ? formatDate(dashboard.lastWorkout.completedAt, locale)
    : t('noLastWorkout');

  if (mobile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-gym-separator bg-gradient-to-br from-primary/12 via-gym-surface to-gym-tint p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('streakHero')}</p>
              <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight">
                {dashboard.streakWeeks}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t('streakUnit')}</p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Flame aria-hidden className="h-6 w-6" />
            </span>
          </div>
        </div>

        <GymStatGrid>
          <GymStatTile
            className="border-primary/15 bg-primary/[0.04]"
            label={t('workoutsThisWeekLabel')}
            unit={t('workoutsThisWeekUnit')}
            value={dashboard.workoutsThisWeek}
          />
          <GymStatTile
            label={t('weeklySetsLabel')}
            unit={t('weeklySetsUnit')}
            value={dashboard.weeklySetsCompleted}
          />
          <GymStatTile
            label={t('weeklyVolumeLabel')}
            unit={t('volumeUnit')}
            value={formatVolume(dashboard.weeklyVolumeKg)}
          />
          <GymStatTile label={t('lastWorkoutLabel')} value={lastWorkoutLabel} />
        </GymStatGrid>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-gym-tint">
        <CardContent className="flex items-center justify-between gap-6 p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('streakHero')}</p>
            <p className="mt-2 text-5xl font-bold tabular-nums">{dashboard.streakWeeks}</p>
            <p className="text-sm text-muted-foreground">{t('streakUnit')}</p>
          </div>
          <Flame aria-hidden className="h-14 w-14 text-primary opacity-80" />
        </CardContent>
      </Card>

      <StatGrid>
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <Dumbbell aria-hidden className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('workoutsThisWeekLabel')}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{dashboard.workoutsThisWeek}</p>
              <p className="text-sm text-muted-foreground">{t('workoutsThisWeekUnit')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <Layers aria-hidden className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('weeklySetsLabel')}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {dashboard.weeklySetsCompleted}
              </p>
              <p className="text-sm text-muted-foreground">{t('weeklySetsUnit')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <TrendingUp aria-hidden className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('weeklyVolumeLabel')}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {formatVolume(dashboard.weeklyVolumeKg)}
              </p>
              <p className="text-sm text-muted-foreground">{t('volumeUnit')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <CalendarDays aria-hidden className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t('lastWorkoutLabel')}</p>
              <p className="mt-2 text-lg font-semibold">{lastWorkoutLabel}</p>
            </div>
          </CardContent>
        </Card>
      </StatGrid>
    </div>
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
    dashboard !== null &&
    (dashboard.lastWorkout !== null ||
      dashboard.streakWeeks > 0 ||
      dashboard.workoutsThisWeek > 0 ||
      dashboard.weeklySetsCompleted > 0);

  const motivationalLine = useMotivationalLine(
    hasActivity ? 'dashboardActive' : 'dashboardEmpty',
    profile,
  );
  const subtitle = hasActivity ? t('subtitle') : t('emptySubtitle');

  const startWorkoutButton = (
    <Button
      asChild
      className={cn(isDesktop ? undefined : 'min-h-12 w-full text-base font-semibold')}
    >
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
            <div className="flex flex-col gap-4">
              <Skeleton className="h-32 rounded-lg" />
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
                <Skeleton className="h-28 rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-32 rounded-2xl" />
              <GymStatGrid>
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </GymStatGrid>
            </div>
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
