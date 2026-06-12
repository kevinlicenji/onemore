'use client';

import type { NextWorkoutPreview, WorkoutSessionDetail } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import {
  abandonWorkoutSessionClient,
  getActiveWorkoutSessionClient,
  getNextWorkoutPreviewClient,
  startWorkoutSessionClient,
} from '@/lib/offline/workout-client';
import { useSync } from '@/components/sync-provider';
import { trackEvent } from '@/lib/analytics';

export default function StartWorkoutPage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [preview, setPreview] = useState<NextWorkoutPreview | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSessionDetail | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshPendingCount } = useSync();

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void Promise.all([
      getNextWorkoutPreviewClient(accessToken),
      getActiveWorkoutSessionClient(accessToken),
    ])
      .then(([nextWorkout, session]) => {
        setPreview(nextWorkout);
        setActiveSession(session);
        const defaultDay =
          nextWorkout.days.find((day) => day.workoutDayId === nextWorkout.workoutDayId) ??
          nextWorkout.days[0] ??
          null;
        setSelectedDayId(defaultDay?.workoutDayId ?? null);
      })
      .catch(() => {
        setError(t('loadError'));
      });
  }, [accessToken, t]);

  async function handleAbandonActive(): Promise<void> {
    if (!accessToken || !activeSession) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await abandonWorkoutSessionClient(accessToken, activeSession.id);
      setActiveSession(null);
      await refreshPendingCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('abandonError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleStart(sessionType: 'programmed' | 'free'): Promise<void> {
    if (!accessToken) {
      return;
    }
    if (activeSession) {
      setError(t('activeSessionBlocksStart'));
      return;
    }
    if (sessionType === 'programmed' && !selectedDayId) {
      setError(t('selectDayError'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await startWorkoutSessionClient(accessToken, {
        id: crypto.randomUUID(),
        sessionType,
        programAssignmentId:
          sessionType === 'programmed' ? (preview?.programAssignmentId ?? undefined) : undefined,
        workoutDayId: sessionType === 'programmed' ? (selectedDayId ?? undefined) : undefined,
      });
      trackEvent('workout_started', {
        session_id: session.id,
        session_type: sessionType,
      });
      await refreshPendingCount();
      router.push(`/${locale}/workouts/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('startError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{t('startTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('startSubtitle')}</p>
        </div>

        {activeSession && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <p className="font-medium">{t('resumeTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeSession.workoutDayLabel ?? t('freeWorkoutTitle')}
              {' · '}
              {t('resumeProgress', {
                completed: activeSession.exercises.filter(
                  (exercise) => exercise.status === 'completed',
                ).length,
                total: activeSession.exercises.length,
              })}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild className="min-h-11 w-full">
                <Link href={`/${locale}/workouts/${activeSession.id}`}>{t('resumeCta')}</Link>
              </Button>
              <Button
                className="min-h-11"
                disabled={loading}
                type="button"
                variant="outline"
                onClick={() => {
                  void handleAbandonActive();
                }}
              >
                {t('abandonActive')}
              </Button>
            </div>
          </div>
        )}

        {preview?.hasActiveAssignment && preview.days.length > 0 && !activeSession && (
          <div className="rounded-lg border p-4">
            <p className="font-medium">{preview.programName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('selectDayTitle')}</p>
            <div className="mt-3 flex flex-col gap-2">
              {preview.days.map((day) => (
                <button
                  key={day.workoutDayId}
                  type="button"
                  className={`rounded-lg border p-3 text-left ${selectedDayId === day.workoutDayId ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => {
                    setSelectedDayId(day.workoutDayId);
                  }}
                >
                  <span className="font-medium">{day.label}</span>
                  <p className="text-sm text-muted-foreground">
                    {t('nextDayMeta', { label: day.label, count: day.exerciseCount })}
                  </p>
                </button>
              ))}
            </div>
            <Button
              className="mt-3 w-full"
              disabled={loading || !selectedDayId}
              type="button"
              onClick={() => {
                void handleStart('programmed');
              }}
            >
              {t('startSelectedDay')}
            </Button>
          </div>
        )}

        {!activeSession && (
          <Button
            className="min-h-11"
            disabled={loading}
            type="button"
            variant="outline"
            onClick={() => {
              void handleStart('free');
            }}
          >
            {t('startFree')}
          </Button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button asChild variant="ghost">
          <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
