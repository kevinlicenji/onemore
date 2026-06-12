'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface GymStatTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  className?: string;
}

/**
 * Compact stat cell for the mobile 2×2 dashboard grid.
 */
export function GymStatTile({ label, value, unit, className }: GymStatTileProps): ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-2xl border border-gym-separator bg-gym-surface p-4 shadow-sm',
        className,
      )}
    >
      <p className="text-pretty text-mobile-footnote font-medium text-muted-foreground">{label}</p>
      <div className="mt-2">
        <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        {unit ? <p className="text-xs text-muted-foreground">{unit}</p> : null}
      </div>
    </div>
  );
}
