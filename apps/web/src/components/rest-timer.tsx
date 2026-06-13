'use client';

import { Button } from '@onemore/ui';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { useWakeLock } from '@/hooks/use-wake-lock';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { playRestCompleteChime } from '@/lib/rest-timer-alert';
import { getElapsedRestSeconds } from '@/lib/rest-elapsed-seconds';
import { triggerHaptic } from '@/lib/haptic';

type RestTimerVariant = 'default' | 'gym';

interface RestTimerProps {
  seconds: number;
  label: string;
  nextSetLabel: string;
  motivationalLine?: string;
  variant?: RestTimerVariant;
  onNextSet: (actualRestSeconds: number) => void;
  onRestComplete?: () => void;
}

const RING_RADIUS = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Countdown rest timer shown after completing a set.
 * Gym variant auto-advances when the countdown finishes.
 */
export function RestTimer({
  seconds,
  label,
  nextSetLabel,
  motivationalLine,
  variant = 'default',
  onNextSet,
  onRestComplete,
}: RestTimerProps): React.ReactElement {
  const [remaining, setRemaining] = useState(seconds);
  const startedAtRef = useRef(Date.now());
  const plannedSecondsRef = useRef(seconds);
  const onNextSetRef = useRef(onNextSet);
  const onRestCompleteRef = useRef(onRestComplete);
  const restCompleteSignaledRef = useRef(false);
  const autoAdvancedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const isActive = remaining > 0;
  useWakeLock(isActive);

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
    if (variant !== 'gym' || remaining > 0 || autoAdvancedRef.current) {
      return;
    }
    const timer = window.setTimeout(
      () => {
        if (autoAdvancedRef.current) {
          return;
        }
        autoAdvancedRef.current = true;
        onNextSetRef.current(
          getElapsedRestSeconds(startedAtRef.current, plannedSecondsRef.current),
        );
      },
      reducedMotion ? 200 : 700,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [remaining, reducedMotion, variant]);

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
    onNextSetRef.current(getElapsedRestSeconds(startedAtRef.current, plannedSecondsRef.current));
  }

  if (variant === 'gym') {
    const displayRemaining = Math.max(0, remaining);
    const progress =
      plannedSecondsRef.current > 0 ? displayRemaining / plannedSecondsRef.current : 0;
    const ringOffset = RING_CIRCUMFERENCE * (1 - progress);
    const tickTransition = reducedMotion
      ? { duration: 0 }
      : { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as const };
    const pulseTransition = reducedMotion
      ? { duration: 0 }
      : { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] as const };

    return (
      <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-4rem)] flex-col items-center justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="text-base font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <div className="relative mt-6 flex h-56 w-56 items-center justify-center">
          <motion.svg
            animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }}
            aria-hidden
            className="absolute inset-0 h-full w-full -rotate-90"
            key={displayRemaining}
            transition={pulseTransition}
            viewBox="0 0 200 200"
          >
            <circle
              className="text-muted/30"
              cx="100"
              cy="100"
              fill="none"
              r={RING_RADIUS}
              stroke="currentColor"
              strokeWidth="6"
            />
            <circle
              className="text-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
              cx="100"
              cy="100"
              fill="none"
              r={RING_RADIUS}
              stroke="currentColor"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              strokeWidth="6"
            />
          </motion.svg>

          <div className="relative h-[7.5rem] w-full max-w-[10rem] overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.p
                key={displayRemaining}
                animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center text-7xl font-bold tabular-nums tracking-tight"
                exit={reducedMotion ? undefined : { opacity: 0, y: -18, scale: 0.92 }}
                initial={reducedMotion ? undefined : { opacity: 0, y: 18, scale: 1.04 }}
                transition={tickTransition}
              >
                {displayRemaining}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-1 text-lg text-muted-foreground">sec</p>

        {motivationalLine ? (
          <p className="mt-6 max-w-sm text-center text-base font-medium leading-snug text-foreground/90">
            {motivationalLine}
          </p>
        ) : null}

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
          <Button className="min-h-14 text-lg" type="button" onClick={handleNextSet}>
            {nextSetLabel}
          </Button>
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
