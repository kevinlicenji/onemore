'use client';

import type { PersonalRecordSummary } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { AnimatedDialog } from '@/components/motion/animated-dialog';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { GymPrConfetti } from '@/components/workout/gym-pr-confetti';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatPrValue } from '@/lib/format-pr-value';
import { triggerHaptic } from '@/lib/haptic';

type PrCelebrationVariant = 'default' | 'gym';

interface PrCelebrationProps {
  records: PersonalRecordSummary[];
  variant?: PrCelebrationVariant;
  onDismiss: () => void;
}

/**
 * In-app celebration modal when the athlete achieves a personal record.
 */
export function PrCelebration({
  records,
  variant = 'default',
  onDismiss,
}: PrCelebrationProps): React.ReactElement | null {
  const t = useTranslations('Progress');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (records.length === 0) {
      return;
    }
    if (variant === 'gym') {
      triggerHaptic('success');
    }
  }, [records.length, variant]);

  if (records.length === 0) {
    return null;
  }

  if (variant === 'gym') {
    return (
      <AnimatedDialog
        ariaLabelledby="pr-celebration-title"
        className="relative flex h-full w-full max-w-none flex-1 flex-col justify-between rounded-none border-0 bg-transparent p-0 shadow-none"
        overlayClassName="z-[70] flex h-full flex-col items-stretch justify-stretch bg-background/98 p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      >
        <GymPrConfetti />

        <div className="relative flex flex-1 flex-col justify-center px-6 py-8">
          <motion.div
            animate={
              reducedMotion
                ? { scale: 1, opacity: 1 }
                : { scale: [1, 1.08, 1], opacity: 1 }
            }
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 text-green-600 ring-2 ring-green-500/25 dark:text-green-400"
            initial={reducedMotion ? undefined : { scale: 0.6, opacity: 0 }}
            transition={
              reducedMotion
                ? { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
                : {
                    scale: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
                    opacity: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
                  }
            }
          >
            <svg
              aria-hidden
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path d="M8 21h8" />
              <path d="M12 17v4" />
              <path d="M7 4h10l1 5H6l1-5Z" />
              <path d="M6 9h12v2a6 6 0 0 1-12 0V9Z" />
            </svg>
          </motion.div>

          <h2 id="pr-celebration-title" className="text-center text-3xl font-bold tracking-tight">
            {t('prTitle')}
          </h2>
          <p className="mt-2 text-center text-base text-muted-foreground">{t('prSubtitle')}</p>

          <StaggerGroup className="mt-8 flex flex-col gap-3">
            {records.map((record) => (
              <StaggerItem key={record.id}>
                <motion.div
                  animate={
                    reducedMotion ? undefined : { boxShadow: ['0 0 0 0 hsl(142 60% 45% / 0)', '0 0 0 6px hsl(142 60% 45% / 0.12)', '0 0 0 0 hsl(142 60% 45% / 0)'] }
                  }
                  className="rounded-2xl border-2 border-green-500/30 bg-card p-4 shadow-sm"
                  transition={
                    reducedMotion
                      ? undefined
                      : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                  }
                >
                  <p className="text-lg font-semibold">{record.exerciseName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`prType_${record.prType}`)}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
                    {formatPrValue(record)}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>

        <div className="relative px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <Button
            className="min-h-14 w-full text-lg font-semibold"
            type="button"
            onClick={onDismiss}
          >
            {t('prDismiss')}
          </Button>
        </div>
      </AnimatedDialog>
    );
  }

  return (
    <AnimatedDialog ariaLabelledby="pr-celebration-title">
      <h2 id="pr-celebration-title" className="text-xl font-bold">
        {t('prTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('prSubtitle')}</p>
      <StaggerGroup className="mt-4 flex flex-col gap-2">
        {records.map((record) => (
          <StaggerItem key={record.id}>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{record.exerciseName}</p>
              <p className="text-muted-foreground">
                {t(`prType_${record.prType}`)} · {formatPrValue(record)}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
      <Button className="mt-4 w-full" type="button" onClick={onDismiss}>
        {t('prDismiss')}
      </Button>
    </AnimatedDialog>
  );
}
