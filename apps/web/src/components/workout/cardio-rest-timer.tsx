'use client';

import { computePeakBpm, computePulseDurationSeconds, computeRecoveryBpm } from '@onemore/shared';
import { Button, cn } from '@onemore/ui';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useWakeLock } from '@/hooks/use-wake-lock';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { playRestCompleteChime } from '@/lib/rest-timer-alert';
import { pickRestTrivia } from '@/lib/rest-trivia';
import { getElapsedRestSeconds } from '@/lib/rest-elapsed-seconds';
import { triggerHaptic } from '@/lib/haptic';

interface CardioRestTimerProps {
  seconds: number;
  locale: string;
  rpe?: number | null;
  nextSetLabel: string;
  compact?: boolean;
  onNextSet: (actualRestSeconds: number) => void;
  onRestComplete?: () => void;
}

function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Full-screen cardio recovery timer with simulated BPM pulse and rest trivia.
 */
export function CardioRestTimer({
  seconds,
  locale,
  rpe,
  nextSetLabel,
  compact = false,
  onNextSet,
  onRestComplete,
}: CardioRestTimerProps): React.ReactElement {
  const t = useTranslations('Workouts');
  const [remaining, setRemaining] = useState(seconds);
  const [bonusSeconds, setBonusSeconds] = useState(0);
  const [trivia] = useState(() => (compact ? null : pickRestTrivia(locale)));
  const startedAtRef = useRef(Date.now());
  const plannedSecondsRef = useRef(seconds);
  const onNextSetRef = useRef(onNextSet);
  const onRestCompleteRef = useRef(onRestComplete);
  const restCompleteSignaledRef = useRef(false);
  const autoAdvancedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const isActive = remaining > 0;
  useWakeLock(isActive);

  const peakBpm = useMemo(() => computePeakBpm(rpe), [rpe]);
  const displayRemaining = Math.max(0, remaining);
  const currentBpm = computeRecoveryBpm(
    peakBpm,
    displayRemaining,
    plannedSecondsRef.current + bonusSeconds,
  );
  const pulseDuration = useMemo(() => computePulseDurationSeconds(peakBpm), [peakBpm]);

  useEffect(() => {
    onNextSetRef.current = onNextSet;
  }, [onNextSet]);

  useEffect(() => {
    onRestCompleteRef.current = onRestComplete;
  }, [onRestComplete]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    plannedSecondsRef.current = seconds;
    restCompleteSignaledRef.current = false;
    autoAdvancedRef.current = false;
    setBonusSeconds(0);
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining > 0 || restCompleteSignaledRef.current) {
      return;
    }
    restCompleteSignaledRef.current = true;
    triggerHaptic('medium');
    playRestCompleteChime();
    onRestCompleteRef.current?.();
  }, [remaining]);

  useEffect(() => {
    if (remaining > 0 || autoAdvancedRef.current) {
      return;
    }
    const timer = window.setTimeout(
      () => {
        if (autoAdvancedRef.current) {
          return;
        }
        autoAdvancedRef.current = true;
        onNextSetRef.current(
          getElapsedRestSeconds(startedAtRef.current, plannedSecondsRef.current + bonusSeconds),
        );
      },
      reducedMotion ? 200 : 2000,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [remaining, reducedMotion, bonusSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRemaining((value) => value - 1);
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [remaining]);

  function handleNextSet(): void {
    autoAdvancedRef.current = true;
    onNextSetRef.current(
      getElapsedRestSeconds(startedAtRef.current, plannedSecondsRef.current + bonusSeconds),
    );
  }

  function handleAddThirty(): void {
    setBonusSeconds((value) => value + 30);
    setRemaining((value) => value + 30);
  }

  return (
    <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-4rem)] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {!compact ? (
          <motion.div
            animate={
              reducedMotion
                ? undefined
                : {
                    scale: [1, 1.1, 1.04, 1.08, 1],
                    opacity: [0.92, 1, 0.96, 1, 0.92],
                  }
            }
            className="relative flex h-40 w-40 items-center justify-center"
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: pulseDuration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    times: [0, 0.14, 0.28, 0.42, 1],
                  }
            }
          >
            <Heart aria-hidden className="h-28 w-28 fill-primary text-primary" strokeWidth={1.5} />
            <span className="absolute bottom-2 rounded-full bg-background/90 px-2 py-0.5 text-sm font-bold tabular-nums text-primary shadow-sm">
              {currentBpm} BPM
            </span>
          </motion.div>
        ) : null}

        <p
          className={cn(
            'font-bold tabular-nums tracking-tight',
            compact ? 'text-6xl' : 'mt-6 text-5xl',
          )}
        >
          {formatMmSs(displayRemaining)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {compact ? t('restLabel') : t('restCardioRecovering')}
        </p>
      </div>

      {!compact && trivia ? (
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-gym-separator bg-gym-surface/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t('restTriviaTitle')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{trivia}</p>
        </div>
      ) : null}

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 self-center">
        <Button className="min-h-14 text-lg" type="button" onClick={handleNextSet}>
          {nextSetLabel}
        </Button>
        <Button className="min-h-11" type="button" variant="outline" onClick={handleAddThirty}>
          {t('restAddThirty')}
        </Button>
      </div>
    </div>
  );
}
