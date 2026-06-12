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

interface RowTextBlockProps {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  active?: boolean;
}

function RowTextBlock({ title, subtitle, meta, active }: RowTextBlockProps): ReactElement {
  return (
    <div className="min-w-0 flex-1">
      <div
        className={cn(
          'w-full text-pretty font-semibold leading-snug text-foreground',
          active && 'text-primary',
        )}
      >
        {title}
      </div>
      {subtitle || meta ? (
        <div className="mt-0.5 flex w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-mobile-footnote text-muted-foreground">
          {subtitle ? <span className="min-w-0 text-pretty">{subtitle}</span> : null}
          {meta ? <span className="shrink-0">{meta}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

const rowClassName =
  'flex w-full min-h-[3.25rem] items-center gap-3 px-4 py-3 text-left transition-colors';

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
  if (href) {
    return (
      <li
        className={cn(
          'flex min-h-[3.25rem] items-center border-b border-gym-separator last:border-b-0',
          active && 'bg-primary/6',
          className,
        )}
      >
        <Link
          className={cn(rowClassName, 'min-w-0 flex-1 active:bg-muted/50', active && 'bg-primary/6')}
          href={href}
        >
          {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
          <RowTextBlock active={active} meta={meta} subtitle={subtitle} title={title} />
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
        <button
          className={cn(rowClassName, 'active:bg-muted/50', active && 'bg-primary/6', disabled && 'opacity-60')}
          disabled={disabled}
          type="button"
          onClick={onClick}
        >
          {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
          <RowTextBlock active={active} meta={meta} subtitle={subtitle} title={title} />
          {trailing}
          {showChevron ? (
            <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground/70" />
          ) : null}
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
      {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
      <RowTextBlock active={active} meta={meta} subtitle={subtitle} title={title} />
      {trailing}
      {showChevron ? (
        <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground/70" />
      ) : null}
    </li>
  );
}
