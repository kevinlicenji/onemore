'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { Button, Card, CardContent, Input } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { StatGrid } from '@/components/layout/desktop/stat-grid';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { deleteHistorySession, fetchHistorySessionDetail, updateHistorySet } from '@/lib/api-auth';
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
  const searchParams = useSearchParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const isDesktop = useIsDesktop();
  const editMode = searchParams.get('edit') === '1';

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingSetId, setSavingSetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleSaveSet(
    setId: string,
    weightKg: number | null,
    reps: number | null,
  ): Promise<void> {
    if (!accessToken || !sessionId) {
      return;
    }
    setSavingSetId(setId);
    setError(null);
    try {
      const updated = await updateHistorySet(accessToken, sessionId, setId, { weightKg, reps });
      setSession(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editSetError'));
    } finally {
      setSavingSetId(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!accessToken || !sessionId) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteHistorySession(accessToken, sessionId);
      window.location.href = `/${locale}/history`;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteSessionError'));
      setDeleting(false);
    }
  }

  if (error && !session) {
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
    <div className="flex flex-wrap gap-2">
      {editMode ? (
        <Button
          disabled={deleting}
          type="button"
          variant="destructive"
          onClick={() => void handleDelete()}
        >
          {t('deleteSession')}
        </Button>
      ) : null}
      <Button asChild variant="outline">
        <Link href={`/${locale}/history`}>{t('backToHistory')}</Link>
      </Button>
    </div>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/history`}
        backLabel={t('backToHistory')}
        title={session.workoutDayLabel ?? t('freeWorkout')}
        description={editMode ? t('editSessionSubtitle') : completedLabel}
        actions={isDesktop ? headerActions : undefined}
        variant="wide"
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
                <ul className="mt-3 space-y-2 text-sm">
                  {exercise.sets.map((set) => {
                    if (!set.isCompleted && !set.isSkipped) {
                      return null;
                    }
                    if (set.isSkipped) {
                      return (
                        <li
                          key={set.id}
                          className="rounded-md bg-muted/40 px-2 py-1 text-muted-foreground"
                        >
                          {t('setSkipped', { number: set.setNumber })}
                        </li>
                      );
                    }

                    if (editMode) {
                      return (
                        <li key={set.id} className="rounded-md bg-muted/20 px-3 py-3">
                          <p className="mb-2 font-medium">
                            {t('editSetNumber', { number: set.setNumber })}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="flex flex-col gap-1 text-xs">
                              {t('editRepsLabel')}
                              <Input
                                className="min-h-10"
                                inputMode="numeric"
                                type="number"
                                value={set.reps ?? ''}
                                onChange={(event) => {
                                  const nextReps =
                                    event.target.value === '' ? null : Number(event.target.value);
                                  setSession((current) => {
                                    if (!current) {
                                      return current;
                                    }
                                    return {
                                      ...current,
                                      exercises: current.exercises.map((item) =>
                                        item.id === exercise.id
                                          ? {
                                              ...item,
                                              sets: item.sets.map((row) =>
                                                row.id === set.id
                                                  ? { ...row, reps: nextReps }
                                                  : row,
                                              ),
                                            }
                                          : item,
                                      ),
                                    };
                                  });
                                }}
                              />
                            </label>
                            {!exercise.exercise.isBodyweight ? (
                              <label className="flex flex-col gap-1 text-xs">
                                {t('editWeightLabel')}
                                <Input
                                  className="min-h-10"
                                  inputMode="decimal"
                                  step="0.5"
                                  type="number"
                                  value={set.weightKg ?? ''}
                                  onChange={(event) => {
                                    const nextWeight =
                                      event.target.value === '' ? null : Number(event.target.value);
                                    setSession((current) => {
                                      if (!current) {
                                        return current;
                                      }
                                      return {
                                        ...current,
                                        exercises: current.exercises.map((item) =>
                                          item.id === exercise.id
                                            ? {
                                                ...item,
                                                sets: item.sets.map((row) =>
                                                  row.id === set.id
                                                    ? { ...row, weightKg: nextWeight }
                                                    : row,
                                                ),
                                              }
                                            : item,
                                        ),
                                      };
                                    });
                                  }}
                                />
                              </label>
                            ) : null}
                          </div>
                          <Button
                            className="mt-2 min-h-9"
                            disabled={savingSetId === set.id}
                            size="sm"
                            type="button"
                            onClick={() => {
                              void handleSaveSet(set.id, set.weightKg, set.reps);
                            }}
                          >
                            {t('saveSet')}
                          </Button>
                        </li>
                      );
                    }

                    return (
                      <li key={set.id} className="rounded-md bg-muted/20 px-2 py-1">
                        {t('setLine', {
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
