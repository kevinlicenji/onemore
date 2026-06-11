'use client';

import { Button } from '@onemore/ui';
import { useEffect, useState } from 'react';

interface RestTimerProps {
  seconds: number;
  label: string;
  skipLabel: string;
  onComplete: () => void;
}

/**
 * Countdown rest timer shown after completing a set.
 */
export function RestTimer({
  seconds,
  label,
  skipLabel,
  onComplete,
}: RestTimerProps): React.ReactElement | null {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(() => {
      setRemaining((value) => value - 1);
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [remaining, onComplete]);

  if (remaining <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{remaining}s</p>
      <Button
        className="mt-3"
        type="button"
        variant="outline"
        onClick={() => {
          onComplete();
        }}
      >
        {skipLabel}
      </Button>
    </div>
  );
}
