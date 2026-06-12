'use client';

import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface GymHeroCtaProps {
  title: string;
  description?: string;
  action: ReactNode;
  className?: string;
}

/**
 * Prominent gradient card for the primary mobile action on a screen.
 */
export function GymHeroCta({ title, description, action, className }: GymHeroCtaProps): ReactElement {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-gym-tint to-gym-surface p-5 shadow-sm',
        className,
      )}
    >
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4">{action}</div>
    </div>
  );
}
