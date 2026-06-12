'use client';

import type { WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
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
        <main className="mx-auto max-w-lg p-6">
          <p className="text-sm text-red-600">{error}</p>
        </main>
      </RequireAuth>
    );
  }

  if (!session || !stats) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-lg p-6">
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{session.workoutDayLabel ?? t('freeWorkout')}</h1>
            {session.completedAt && (
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(session.completedAt).toLocaleString(locale)}
              </p>
            )}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/${locale}/history`}>{t('backToHistory')}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t('detailVolume')}</p>
            <p className="text-lg font-bold">{stats.totalVolumeKg} kg</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t('detailSets')}</p>
            <p className="text-lg font-bold">{stats.completedSets}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t('detailExercises')}</p>
            <p className="text-lg font-bold">{stats.exerciseCount}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{t('detailDuration')}</p>
            <p className="text-lg font-bold">
              {session.durationSeconds !== null
                ? `${String(Math.round(session.durationSeconds / 60))} min`
                : '—'}
            </p>
          </div>
        </div>

        {session.privateNotes && (
          <div className="rounded-lg border border-dashed p-3 text-sm">
            <p className="font-medium">{t('detailNotes')}</p>
            <p className="mt-1 text-muted-foreground">{session.privateNotes}</p>
          </div>
        )}

        {session.exercises.map((exercise) => (
          <section key={exercise.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{exerciseName(exercise, locale)}</h2>
              {exercise.status === 'skipped' && (
                <span className="text-xs text-muted-foreground">{t('exerciseSkipped')}</span>
              )}
            </div>
            {session.sessionType === 'programmed' && (
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
            )}
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
          </section>
        ))}
      </main>
    </RequireAuth>
  );
}
