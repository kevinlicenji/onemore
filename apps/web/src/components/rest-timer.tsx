'use client';

import { Button } from '@onemore/ui';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { getElapsedRestSeconds } from '@/lib/rest-elapsed-seconds';

type RestTimerVariant = 'default' | 'gym';

interface RestTimerProps {
  seconds: number;
  label: string;
  nextSetLabel: string;
  skipRestLabel?: string;
  variant?: RestTimerVariant;
  onNextSet: (actualRestSeconds: number) => void;
  onSkipRest?: () => void;
  onRestComplete?: () => void;
}

/**
 * Countdown rest timer shown after completing a set. Advances only when the user taps next set.
 */
export function RestTimer({
  seconds,
  label,
  nextSetLabel,
  skipRestLabel,
  variant = 'default',
  onNextSet,
  onSkipRest,
  onRestComplete,
}: RestTimerProps): React.ReactElement {
  const [remaining, setRemaining] = useState(seconds);
  const startedAtRef = useRef(Date.now());
  const plannedSecondsRef = useRef(seconds);
  const onNextSetRef = useRef(onNextSet);
  const onRestCompleteRef = useRef(onRestComplete);
  const restCompleteSignaledRef = useRef(false);
  const reducedMotion = useReducedMotion();

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
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining > 0 || restCompleteSignaledRef.current) {
      return;
    }
    restCompleteSignaledRef.current = true;
    onRestCompleteRef.current?.();
  }, [remaining]);

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
    onNextSetRef.current(
      getElapsedRestSeconds(startedAtRef.current, plannedSecondsRef.current),
    );
  }

  if (variant === 'gym') {
    const displayRemaining = Math.max(0, remaining);
    const tickTransition = reducedMotion
      ? { duration: 0 }
      : { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as const };

    return (
      <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-4rem)] flex-col items-center justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-base font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="relative mt-4 h-[7.5rem] w-full max-w-xs overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.p
              key={displayRemaining}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center text-8xl font-bold tabular-nums tracking-tight"
              exit={reducedMotion ? undefined : { opacity: 0, y: -18, scale: 0.92 }}
              initial={reducedMotion ? undefined : { opacity: 0, y: 18, scale: 1.04 }}
              transition={tickTransition}
            >
              {displayRemaining}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-1 text-lg text-muted-foreground">sec</p>
        <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
          <Button className="min-h-14 text-lg" type="button" onClick={handleNextSet}>
            {nextSetLabel}
          </Button>
          {skipRestLabel && onSkipRest && (
            <Button
              className="min-h-12"
              type="button"
              variant="ghost"
              onClick={() => {
                onSkipRest();
              }}
            >
              {skipRestLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{Math.max(0, remaining)}s</p>
      <Button className="mt-3 min-h-11" type="button" onClick={handleNextSet}>
        {nextSetLabel}
      </Button>
    </div>
  );
}
