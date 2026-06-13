import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  titleTrailing?: ReactNode;
  className?: string;
}

/**
 * Desktop page title row with optional description and right-aligned actions.
 */
export function PageHeader({
  title,
  description,
  actions,
  titleTrailing,
  className,
}: PageHeaderProps): ReactElement {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}
    >
      <div className="space-y-2 sm:flex-1">
        <div className="flex w-full items-center justify-between gap-3">
          <h1 className="text-title text-foreground">{title}</h1>
          {titleTrailing}
        </div>
        {description ? (
          <p className="max-w-2xl text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
