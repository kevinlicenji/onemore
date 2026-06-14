'use client';

import { localizeWorkoutDayLabel, type DifficultyLevel } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { motion } from 'motion/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { useSync } from '@/components/sync-provider';
import { useMotivationalLine } from '@/hooks/use-motivational-line';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { trackEvent } from '@/lib/analytics';
import { generateClientUuid } from '@/lib/generate-client-uuid';
import { triggerHaptic } from '@/lib/haptic';
import {
  getNextWorkoutPreviewClient,
  startWorkoutSessionClient,
} from '@/lib/offline/workout-client';

const COUNTDOWN_SECONDS = 10;

export default function WorkoutPreparePage(): React.ReactElement {
  const t = useTranslations('Workouts');
  const { accessToken, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const dayId = searchParams.get('dayId');
  const reducedMotion = useReducedMotion();
  const { refreshPendingCount } = useSync();

  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayLabel, setDayLabel] = useState<string | null>(null);
  const [dayDifficulty, setDayDifficulty] = useState<DifficultyLevel>(2);

  const motivationalLine = useMotivationalLine('workoutStart', profile, {
    difficultyLevel: dayDifficulty,
  });

  const startWorkout = useCallback(async (): Promise<void> => {
    if (!accessToken || !dayId || starting) {
      return;
    }
    setStarting(true);
    setError(null);
    triggerHaptic('medium');
    try {
      const preview = await getNextWorkoutPreviewClient(accessToken);
      const session = await startWorkoutSessionClient(accessToken, {
        id: generateClientUuid(),
        sessionType: 'programmed',
        programAssignmentId: preview.programAssignmentId ?? undefined,
        workoutDayId: dayId,
      });
      trackEvent('workout_started', {
        session_id: session.id,
        session_type: 'programmed',
      });
      await refreshPendingCount();
      router.replace(`/${locale}/workouts/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('startError'));
      setStarting(false);
    }
  }, [accessToken, dayId, locale, refreshPendingCount, router, starting, t]);

  useEffect(() => {
    if (!accessToken || !dayId) {
      return;
    }
    void getNextWorkoutPreviewClient(accessToken)
      .then((preview) => {
        const day = preview.days.find((entry) => entry.workoutDayId === dayId);
        if (day) {
          setDayLabel(day.label);
          setDayDifficulty(day.difficultyLevel);
        }
      })
      .catch(() => {
        setError(t('loadError'));
      });
  }, [accessToken, dayId, t]);

  useEffect(() => {
    if (!dayId || starting || error) {
      return;
    }
    if (secondsLeft <= 0) {
      void startWorkout();
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [dayId, error, secondsLeft, startWorkout, starting]);

  const countdownLabel = useMemo(() => String(Math.max(0, secondsLeft)), [secondsLeft]);

  if (!dayId) {
    return (
      <RequireAuth>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6">
          <p className="text-sm text-destructive">{t('selectDayError')}</p>
          <Button
            className="mt-4"
            type="button"
            variant="outline"
            onClick={() => {
              router.push(`/${locale}/workouts/start`);
            }}
          >
            {t('backToDashboard')}
          </Button>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <main className="relative flex min-h-dvh flex-col bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {dayLabel ? (
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {localizeWorkoutDayLabel(dayLabel, locale)}
            </p>
          ) : null}
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 max-w-sm text-balance text-2xl font-bold leading-tight"
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.35 }}
          >
            {motivationalLine}
          </motion.h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t('prepareSubtitle')}</p>

          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            className="mt-10 flex h-36 w-36 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/5"
            initial={reducedMotion ? undefined : { scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <span className="text-6xl font-bold tabular-nums text-primary">{countdownLabel}</span>
          </motion.div>

          {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex justify-center pb-2">
          <Button
            className="h-auto px-3 py-1 text-xs text-muted-foreground"
            disabled={starting}
            type="button"
            variant="ghost"
            onClick={() => {
              router.push(`/${locale}/workouts/start`);
            }}
          >
            {t('prepareCancel')}
          </Button>
        </div>
      </main>
    </RequireAuth>
  );
}
