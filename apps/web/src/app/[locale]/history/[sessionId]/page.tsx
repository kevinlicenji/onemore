'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { StatGrid } from '@/components/layout/desktop/stat-grid';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { fetchHistorySessionDetail } from '@/lib/api-auth';
import { computeWorkoutSessionStats } from '@/lib/workout-stats';

function exerciseName(exercise: WorkoutSessionDetail['exercises'][number], locale: string): string {
  if (locale === 'it' && exercise.exercise.names.it) {
    return exercise.exercise.names.it;
  }
  return exercise.exercise.names.en;
}

export default function HistoryDetailPage(): React.ReactElement {
  const t = useTranslations('History');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const isDesktop = useIsDesktop();

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async (): Promise<void> => {
    if (!accessToken || !sessionId) {
      return;
    }
    try {
      const data = await fetchHistorySessionDetail(accessToken, sessionId);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    }
  }, [accessToken, sessionId, t]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const stats = useMemo(() => (session ? computeWorkoutSessionStats(session) : null), [session]);

  if (error) {
    return (
      <RequireAuth>
        <AdaptivePageShell title={t('title')}>
          <p className="text-sm text-destructive">{error}</p>
        </AdaptivePageShell>
      </RequireAuth>
    );
  }

  if (!session || !stats) {
    return (
      <RequireAuth>
        <AdaptivePageShell title={t('title')}>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </AdaptivePageShell>
      </RequireAuth>
    );
  }

  const completedLabel = session.completedAt
    ? new Date(session.completedAt).toLocaleString(locale)
    : undefined;

  const headerActions = (
    <Button asChild variant="outline">
      <Link href={`/${locale}/history`}>{t('backToHistory')}</Link>
    </Button>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/history`}
        backLabel={t('backToHistory')}
        title={session.workoutDayLabel ?? t('freeWorkout')}
        description={completedLabel}
        actions={isDesktop ? headerActions : undefined}
        variant="wide"
      >
        <StatGrid>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{t('detailVolume')}</p>
              <p className="mt-1 text-2xl font-bold">{stats.totalVolumeKg} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{t('detailSets')}</p>
              <p className="mt-1 text-2xl font-bold">{stats.completedSets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{t('detailExercises')}</p>
              <p className="mt-1 text-2xl font-bold">{stats.exerciseCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{t('detailDuration')}</p>
              <p className="mt-1 text-2xl font-bold">
                {session.durationSeconds !== null
                  ? `${String(Math.round(session.durationSeconds / 60))} min`
                  : '—'}
              </p>
            </CardContent>
          </Card>
        </StatGrid>

        {session.privateNotes ? (
          <Card className="border-dashed">
            <CardContent className="p-5 text-sm">
              <p className="font-medium">{t('detailNotes')}</p>
              <p className="mt-1 text-muted-foreground">{session.privateNotes}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className={isDesktop ? 'grid gap-4 lg:grid-cols-2' : 'flex flex-col gap-4'}>
          {session.exercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{exerciseName(exercise, locale)}</h2>
                  {exercise.status === 'skipped' ? (
                    <span className="text-xs text-muted-foreground">{t('exerciseSkipped')}</span>
                  ) : null}
                </div>
                {session.sessionType === 'programmed' ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('prescribedMeta', {
                      sets: exercise.prescription.targetSets,
                      reps: exercise.prescription.targetReps,
                      weight:
                        exercise.prescription.targetWeightKg !== null
                          ? `${String(exercise.prescription.targetWeightKg)} kg`
                          : t('noTargetWeight'),
                    })}
                  </p>
                ) : null}
                <ul className="mt-3 space-y-2 text-sm">
                  {exercise.sets.map((set) => {
                    if (!set.isCompleted && !set.isSkipped) {
                      return null;
                    }
                    return (
                      <li
                        key={set.id}
                        className={`rounded-md px-2 py-1 ${set.isSkipped ? 'bg-muted/40 text-muted-foreground' : 'bg-muted/20'}`}
                      >
                        {set.isSkipped
                          ? t('setSkipped', { number: set.setNumber })
                          : t('setLine', {
                              number: set.setNumber,
                              weight: set.weightKg ?? 0,
                              reps: set.reps ?? 0,
                            })}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdaptivePageShell>
    </RequireAuth>
  );
}
