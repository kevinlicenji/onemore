'use client';

import { cn } from '@onemore/ui';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactElement, ReactNode } from 'react';

interface GymListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  showChevron?: boolean;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Single row inside a GymListGroup with optional chevron and two-line layout.
 */
export function GymListRow({
  title,
  subtitle,
  meta,
  icon,
  trailing,
  href,
  showChevron = false,
  active = false,
  disabled = false,
  className,
  onClick,
}: GymListRowProps): ReactElement {
  const content = (
    <>
      {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className={cn('font-semibold text-foreground', active && 'text-primary')}>
            {title}
          </span>
          {meta ? <span className="text-mobile-footnote text-muted-foreground">{meta}</span> : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing}
      {showChevron ? (
        <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground/70" />
      ) : null}
    </>
  );

  const rowClassName = cn(
    'flex w-full min-h-[3.25rem] items-center gap-3 px-4 py-3 text-left transition-colors',
    onClick || href ? 'active:bg-muted/50' : '',
    active && 'bg-primary/6',
    disabled && 'opacity-60',
  );

  if (href) {
    return (
      <li
        className={cn(
          'flex min-h-[3.25rem] items-center border-b border-gym-separator last:border-b-0',
          active && 'bg-primary/6',
          className,
        )}
      >
        <Link className={cn(rowClassName, 'min-w-0 flex-1')} href={href}>
          {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className={cn('font-semibold text-foreground', active && 'text-primary')}>
                {title}
              </span>
              {meta ? (
                <span className="text-mobile-footnote text-muted-foreground">{meta}</span>
              ) : null}
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {showChevron ? (
            <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground/70" />
          ) : null}
        </Link>
        {trailing}
      </li>
    );
  }

  if (onClick) {
    return (
      <li className={cn('border-b border-gym-separator last:border-b-0', className)}>
        <button className={rowClassName} disabled={disabled} type="button" onClick={onClick}>
          {content}
        </button>
      </li>
    );
  }

  return (
    <li
      className={cn(
        'flex min-h-[3.25rem] items-center gap-3 border-b border-gym-separator px-4 py-3 last:border-b-0',
        active && 'bg-primary/6',
        className,
      )}
    >
      {content}
    </li>
  );
}
