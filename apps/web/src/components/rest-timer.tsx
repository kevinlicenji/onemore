'use client';

import { Button } from '@onemore/ui';
import { useEffect, useRef, useState } from 'react';

import { getElapsedRestSeconds } from '@/lib/rest-elapsed-seconds';

interface RestTimerProps {
  seconds: number;
  label: string;
  nextSetLabel: string;
  onNextSet: (actualRestSeconds: number) => void;
}

/**
 * Countdown rest timer shown after completing a set. Advances only when the user taps next set.
 */
export function RestTimer({
  seconds,
  label,
  nextSetLabel,
  onNextSet,
}: RestTimerProps): React.ReactElement {
  const [remaining, setRemaining] = useState(seconds);
  const startedAtRef = useRef(Date.now());
  const plannedSecondsRef = useRef(seconds);
  const onNextSetRef = useRef(onNextSet);

  useEffect(() => {
    onNextSetRef.current = onNextSet;
  }, [onNextSet]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    plannedSecondsRef.current = seconds;
    setRemaining(seconds);
  }, [seconds]);

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
