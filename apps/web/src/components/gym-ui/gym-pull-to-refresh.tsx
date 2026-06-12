'use client';

import { cn } from '@onemore/ui';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactElement, ReactNode } from 'react';

import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface GymPullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  releaseLabel: string;
  refreshingLabel: string;
}

/**
 * Mobile pull-to-refresh wrapper with a spring indicator below the page header.
 */
export function GymPullToRefresh({
  children,
  onRefresh,
  releaseLabel,
  refreshingLabel,
}: GymPullToRefreshProps): ReactElement {
  const reducedMotion = useReducedMotion();
  const { pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh,
    enabled: !reducedMotion,
  });

  const indicatorLabel = isRefreshing ? refreshingLabel : progress >= 1 ? releaseLabel : '';

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
        style={{ height: Math.max(pullDistance, isRefreshing ? 40 : 0) }}
      >
        <motion.div
          animate={
            reducedMotion
              ? undefined
              : {
                  opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
                  y: isRefreshing ? 8 : Math.max(0, pullDistance - 28),
                }
          }
          className="flex items-center gap-2 rounded-full bg-gym-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-gym-separator"
          initial={false}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          <Loader2
            aria-hidden
            className={cn('h-4 w-4 text-primary', isRefreshing && 'animate-spin')}
            style={{
              transform: isRefreshing ? undefined : `rotate(${String(progress * 320)}deg)`,
            }}
          />
          {indicatorLabel ? <span>{indicatorLabel}</span> : null}
        </motion.div>
      </div>

      <motion.div
        animate={
          reducedMotion
            ? undefined
            : {
                y: isRefreshing ? 36 : pullDistance > 0 ? pullDistance * 0.35 : 0,
              }
        }
        initial={false}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
