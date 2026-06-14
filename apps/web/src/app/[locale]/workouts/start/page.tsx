'use client';

import type { NextWorkoutPreview, WorkoutSessionDetail } from '@onemore/shared';
import { localizeWorkoutDayLabel } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
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
import { ActiveWorkoutConflictSheet } from '@/components/workout/active-workout-conflict-sheet';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useMotivationalLine } from '@/hooks/use-motivational-line';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { trackEvent } from '@/lib/analytics';
import { generateClientUuid } from '@/lib/generate-client-uuid';
import { formatMuscleGroupsForLocale } from '@/lib/muscle-group-labels';
import { triggerHaptic } from '@/lib/haptic';
import {
  abandonWorkoutSessionClient,
  completeWorkoutSessionClient,
  getActiveWorkoutSessionClient,
  getNextWorkoutPreviewClient,
  startWorkoutSessionClient,
} from '@/lib/offline/workout-client';

type PendingStart = { type: 'free' } | { type: 'programmed'; workoutDayId: string };

export default function StartWorkoutPage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const tMuscle = useTranslations('MuscleGroups');
  const { accessToken, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();
  const reducedMotion = useReducedMotion();

  const [preview, setPreview] = useState<NextWorkoutPreview | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSessionDetail | null>(null);
  const [startingDayId, setStartingDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStart, setPendingStart] = useState<PendingStart | null>(null);
  const { refreshPendingCount } = useSync();
  const motionTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };

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

  async function launchStart(pending: PendingStart): Promise<void> {
    if (!accessToken) {
      return;
    }
    triggerHaptic('medium');
    setLoading(true);
    setError(null);
    if (pending.type === 'programmed') {
      setStartingDayId(pending.workoutDayId);
    }
    try {
      const session = await startWorkoutSessionClient(accessToken, {
        id: generateClientUuid(),
        sessionType: pending.type === 'free' ? 'free' : 'programmed',
        programAssignmentId:
          pending.type === 'programmed' ? (preview?.programAssignmentId ?? undefined) : undefined,
        workoutDayId: pending.type === 'programmed' ? pending.workoutDayId : undefined,
      });
      trackEvent('workout_started', {
        session_id: session.id,
        session_type: pending.type === 'free' ? 'free' : 'programmed',
      });
      setActiveSession(null);
      setPendingStart(null);
      await refreshPendingCount();
      router.push(`/${locale}/workouts/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('startError'));
    } finally {
      setLoading(false);
      setStartingDayId(null);
    }
  }

  function requestStart(pending: PendingStart): void {
    if (activeSession) {
      setPendingStart(pending);
      return;
    }
    void launchStart(pending);
  }

  async function resolveConflictAndStart(mode: 'save' | 'discard'): Promise<void> {
    if (!accessToken || !activeSession || !pendingStart) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (mode === 'save') {
        await completeWorkoutSessionClient(accessToken, activeSession.id);
      } else {
        await abandonWorkoutSessionClient(accessToken, activeSession.id);
      }
      setActiveSession(null);
      await refreshPendingCount();
      await launchStart(pendingStart);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('startError'));
    } finally {
      setLoading(false);
    }
  }

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
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
        transition={motionTransition}
      >
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
      </motion.div>
    )
  ) : null;

  const programDaysBlock =
    preview?.hasActiveAssignment && preview.days.length > 0 ? (
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
                      requestStart({ type: 'programmed', workoutDayId: day.workoutDayId });
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
          {preview.days.map((day, index) => {
            const muscles = formatMuscleGroupsForLocale(day.muscleGroups, tMuscle);
            return (
              <motion.div
                key={day.workoutDayId}
                animate={{ opacity: 1, y: 0 }}
                initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
                transition={{ ...motionTransition, delay: reducedMotion ? 0 : index * 0.04 }}
              >
                <GymListRow
                  active={startingDayId === day.workoutDayId}
                  disabled={loading}
                  subtitle={[muscles, t('nextDayMeta', { count: day.exerciseCount })]
                    .filter(Boolean)
                    .join(' · ')}
                  title={localizeWorkoutDayLabel(day.label, locale)}
                  trailing={<DifficultyStepsIcon level={day.difficultyLevel} size="sm" />}
                  onClick={() => {
                    requestStart({ type: 'programmed', workoutDayId: day.workoutDayId });
                  }}
                />
              </motion.div>
            );
          })}
        </GymListGroup>
      )
    ) : null;

  const newWorkoutBlock = isDesktop ? (
    <Card>
      <CardContent className="p-6">
        <p className="font-semibold">{t('newWorkoutSectionTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('newWorkoutSectionSubtitle')}</p>
        <Button
          className="mt-4 w-fit"
          disabled={loading}
          type="button"
          variant="outline"
          onClick={() => {
            requestStart({ type: 'free' });
          }}
        >
          {t('startFree')}
        </Button>
      </CardContent>
    </Card>
  ) : (
    <GymListGroup title={t('newWorkoutSectionTitle')}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        transition={motionTransition}
      >
        <GymListRow
          disabled={loading}
          showChevron
          subtitle={t('newWorkoutSectionSubtitle')}
          title={t('startFree')}
          onClick={() => {
            requestStart({ type: 'free' });
          }}
        />
      </motion.div>
    </GymListGroup>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={motivationalLine}
        description={t('startSubtitle')}
      >
        <div className={isDesktop ? 'grid gap-6 lg:grid-cols-2' : 'flex flex-col gap-5'}>
          <AnimatePresence mode="popLayout">
            {resumeBlock ? (
              <motion.div
                key="resume"
                animate={{ opacity: 1, height: 'auto' }}
                exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                initial={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                transition={motionTransition}
              >
                {resumeBlock}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {programDaysBlock}
          {newWorkoutBlock}
        </div>

        {error ? (
          <motion.p
            animate={{ opacity: 1 }}
            className="text-sm text-destructive"
            initial={reducedMotion ? undefined : { opacity: 0 }}
            transition={motionTransition}
          >
            {error}
          </motion.p>
        ) : null}

        <ActiveWorkoutConflictSheet
          cancelLabel={t('conflictCancel')}
          discardAndStartLabel={t('conflictDiscardAndStart')}
          loading={loading}
          message={t('conflictMessage')}
          open={pendingStart !== null}
          saveAndStartLabel={t('conflictSaveAndStart')}
          title={t('conflictTitle')}
          onCancel={() => {
            setPendingStart(null);
          }}
          onDiscardAndStart={() => {
            void resolveConflictAndStart('discard');
          }}
          onSaveAndStart={() => {
            void resolveConflictAndStart('save');
          }}
        />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
