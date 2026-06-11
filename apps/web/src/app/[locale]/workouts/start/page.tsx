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
  fetchActiveWorkoutSession,
  fetchNextWorkoutPreview,
  startWorkoutSession,
} from '@/lib/api-auth';
import { trackEvent } from '@/lib/analytics';

export default function StartWorkoutPage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [preview, setPreview] = useState<NextWorkoutPreview | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void Promise.all([fetchNextWorkoutPreview(accessToken), fetchActiveWorkoutSession(accessToken)])
      .then(([nextWorkout, session]) => {
        setPreview(nextWorkout);
        setActiveSession(session);
      })
      .catch(() => {
        setError(t('loadError'));
      });
  }, [accessToken, t]);

  async function handleStart(sessionType: 'programmed' | 'free'): Promise<void> {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await startWorkoutSession(accessToken, {
        id: crypto.randomUUID(),
        sessionType,
        programAssignmentId:
          sessionType === 'programmed' ? (preview?.programAssignmentId ?? undefined) : undefined,
        workoutDayId:
          sessionType === 'programmed' ? (preview?.workoutDayId ?? undefined) : undefined,
      });
      trackEvent('workout_started', {
        session_id: session.id,
        session_type: sessionType,
      });
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
          <div className="rounded-lg border p-4">
            <p className="font-medium">{t('resumeTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('resumeBody')}</p>
            <Button asChild className="mt-3 w-full">
              <Link href={`/${locale}/workouts/${activeSession.id}`}>{t('resumeCta')}</Link>
            </Button>
          </div>
        )}

        {preview?.hasActiveAssignment && preview.workoutDayId && (
          <div className="rounded-lg border p-4">
            <p className="font-medium">{preview.programName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('nextDayMeta', {
                label: preview.workoutDayLabel ?? '',
                count: preview.exerciseCount,
              })}
            </p>
            <Button
              className="mt-3 w-full"
              disabled={loading}
              type="button"
              onClick={() => {
                void handleStart('programmed');
              }}
            >
              {t('startProgrammed')}
            </Button>
          </div>
        )}

        <Button
          disabled={loading}
          type="button"
          variant="outline"
          onClick={() => {
            void handleStart('free');
          }}
        >
          {t('startFree')}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button asChild variant="ghost">
          <Link href={`/${locale}/dashboard`}>{t('backToDashboard')}</Link>
        </Button>
      </main>
    </RequireAuth>
  );
}
