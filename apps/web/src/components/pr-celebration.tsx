'use client';

import type { PersonalRecordSummary } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { AnimatedDialog } from '@/components/motion/animated-dialog';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { formatPrValue } from '@/lib/format-pr-value';
import { triggerHaptic } from '@/lib/haptic';

type PrCelebrationVariant = 'default' | 'gym';

const GYM_AUTO_DISMISS_MS = 2500;

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
      const timer = window.setTimeout(() => {
        onDismiss();
      }, GYM_AUTO_DISMISS_MS);
      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [onDismiss, records.length, variant]);

  if (records.length === 0) {
    return null;
  }

  if (variant === 'gym') {
    const primaryRecord = records[0];
    if (!primaryRecord) {
      return null;
    }

    return (
      <motion.div
        animate={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[75] px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
        exit={reducedMotion ? undefined : { opacity: 0, y: -16 }}
        initial={reducedMotion ? undefined : { opacity: 0, y: -20 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-md overflow-hidden rounded-2xl border-2 border-green-500/35 bg-card/95 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
              <svg
                aria-hidden
                className="h-5 w-5"
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
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                {t('prTitle')}
              </p>
              <p className="truncate text-sm font-medium">{primaryRecord.exerciseName}</p>
              <p className="text-xs text-muted-foreground">
                {t(`prType_${primaryRecord.prType}`)} · {formatPrValue(primaryRecord)}
              </p>
            </div>
            <button
              aria-label={t('prDismiss')}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              type="button"
              onClick={onDismiss}
            >
              {t('prDismiss')}
            </button>
          </div>
        </div>
      </motion.div>
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
