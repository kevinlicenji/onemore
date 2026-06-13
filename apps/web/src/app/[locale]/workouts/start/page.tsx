'use client';

import type { NextWorkoutPreview, WorkoutSessionDetail } from '@onemore/shared';
import { localizeWorkoutDayLabel } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { DifficultyStepsIcon } from '@/components/difficulty-steps-icon';
import { GymHeroCta } from '@/components/gym-ui/gym-hero-cta';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAuth } from '@/components/require-auth';
import { useSync } from '@/components/sync-provider';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useMotivationalLine } from '@/hooks/use-motivational-line';
import { trackEvent } from '@/lib/analytics';
import { generateClientUuid } from '@/lib/generate-client-uuid';
import { formatMuscleGroupsForLocale } from '@/lib/muscle-group-labels';
import { triggerHaptic } from '@/lib/haptic';
import {
  abandonWorkoutSessionClient,
  getActiveWorkoutSessionClient,
  getNextWorkoutPreviewClient,
  startWorkoutSessionClient,
} from '@/lib/offline/workout-client';

export default function StartWorkoutPage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const tMuscle = useTranslations('MuscleGroups');
  const { accessToken, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [preview, setPreview] = useState<NextWorkoutPreview | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSessionDetail | null>(null);
  const [startingDayId, setStartingDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshPendingCount } = useSync();
  const workoutDifficulty = useMemo(() => {
    if (!preview?.workoutDayId) {
      return 2;
    }
    const day = preview.days.find((entry) => entry.workoutDayId === preview.workoutDayId);
    return day?.difficultyLevel ?? 2;
  }, [preview]);
  const motivationalLine = useMotivationalLine('workoutStart', profile, {
    difficultyLevel: workoutDifficulty,
  });

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

  async function handleStartProgrammedDay(workoutDayId: string): Promise<void> {
    if (!accessToken) {
      return;
    }
    if (activeSession) {
      setError(t('activeSessionBlocksStart'));
      return;
    }
    triggerHaptic('medium');
    setLoading(true);
    setStartingDayId(workoutDayId);
    setError(null);
    try {
      const session = await startWorkoutSessionClient(accessToken, {
        id: generateClientUuid(),
        sessionType: 'programmed',
        programAssignmentId: preview?.programAssignmentId ?? undefined,
        workoutDayId,
      });
      trackEvent('workout_started', {
        session_id: session.id,
        session_type: 'programmed',
      });
      await refreshPendingCount();
      router.push(`/${locale}/workouts/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('startError'));
    } finally {
      setLoading(false);
      setStartingDayId(null);
    }
  }

  async function handleStartFree(): Promise<void> {
    if (!accessToken) {
      return;
    }
    if (activeSession) {
      setError(t('activeSessionBlocksStart'));
      return;
    }
    triggerHaptic('medium');
    setLoading(true);
    setError(null);
    try {
      const session = await startWorkoutSessionClient(accessToken, {
        id: generateClientUuid(),
        sessionType: 'free',
      });
      trackEvent('workout_started', {
        session_id: session.id,
        session_type: 'free',
      });
      await refreshPendingCount();
      router.push(`/${locale}/workouts/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('startError'));
    } finally {
      setLoading(false);
    }
  }

  const resumeBlock = activeSession ? (
    isDesktop ? (
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-6">
          <p className="font-semibold">{t('resumeTitle')}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {localizeWorkoutDayLabel(
              activeSession.workoutDayLabel ?? t('freeWorkoutTitle'),
              locale,
            )}
            {' · '}
            {t('resumeProgress', {
              completed: activeSession.exercises.filter(
                (exercise) => exercise.status === 'completed',
              ).length,
              total: activeSession.exercises.length,
            })}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/${locale}/workouts/${activeSession.id}`}>{t('resumeCta')}</Link>
            </Button>
            <Button
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
        </CardContent>
      </Card>
    ) : (
      <GymHeroCta
        description={t('resumeProgress', {
          completed: activeSession.exercises.filter((exercise) => exercise.status === 'completed')
            .length,
          total: activeSession.exercises.length,
        })}
        title={`${t('resumeTitle')} · ${localizeWorkoutDayLabel(activeSession.workoutDayLabel ?? t('freeWorkoutTitle'), locale)}`}
        action={
          <div className="flex flex-col gap-2">
            <Button asChild className="min-h-11 w-full">
              <Link href={`/${locale}/workouts/${activeSession.id}`}>{t('resumeCta')}</Link>
            </Button>
            <Button
              className="min-h-11 w-full"
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
        }
      />
    )
  ) : null;

  const programDaysBlock =
    preview?.hasActiveAssignment && preview.days.length > 0 && !activeSession ? (
      isDesktop ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold">{preview.programName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('selectDayTitle')}</p>
            <div className="mt-4 flex flex-col gap-2">
              {preview.days.map((day) => {
                const isStarting = startingDayId === day.workoutDayId;
                const muscles = formatMuscleGroupsForLocale(day.muscleGroups, tMuscle);

                return (
                  <button
                    key={day.workoutDayId}
                    disabled={loading}
                    type="button"
                    className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 active:bg-muted/70 disabled:opacity-60 ${
                      isStarting ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      void handleStartProgrammedDay(day.workoutDayId);
                    }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                      <span className="font-semibold text-foreground">
                        {localizeWorkoutDayLabel(day.label, locale)}
                      </span>
                      <span aria-hidden className="text-xs text-muted-foreground">
                        ·
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('nextDayMeta', { count: day.exerciseCount })}
                      </span>
                    </div>
                    {muscles ? (
                      <p className="mt-1 text-sm text-muted-foreground">{muscles}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <GymListGroup title={preview.programName ?? undefined}>
          {preview.days.map((day) => {
            const muscles = formatMuscleGroupsForLocale(day.muscleGroups, tMuscle);
            return (
              <GymListRow
                key={day.workoutDayId}
                active={startingDayId === day.workoutDayId}
                disabled={loading}
                subtitle={[muscles, t('nextDayMeta', { count: day.exerciseCount })]
                  .filter(Boolean)
                  .join(' · ')}
                title={localizeWorkoutDayLabel(day.label, locale)}
                trailing={<DifficultyStepsIcon level={day.difficultyLevel} size="sm" />}
                onClick={() => {
                  void handleStartProgrammedDay(day.workoutDayId);
                }}
              />
            );
          })}
        </GymListGroup>
      )
    ) : null;

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={motivationalLine}
        description={t('startSubtitle')}
      >
        <div className={isDesktop ? 'grid gap-6 lg:grid-cols-2' : 'flex flex-col gap-5'}>
          {resumeBlock}
          {programDaysBlock}
        </div>

        {!activeSession ? (
          isDesktop ? (
            <Button
              className="w-fit"
              disabled={loading}
              type="button"
              variant="outline"
              onClick={() => {
                void handleStartFree();
              }}
            >
              {t('startFree')}
            </Button>
          ) : (
            <GymListGroup>
              <GymListRow
                disabled={loading}
                showChevron
                title={t('startFree')}
                onClick={() => {
                  void handleStartFree();
                }}
              />
            </GymListGroup>
          )
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </AdaptivePageShell>
    </RequireAuth>
  );
}
