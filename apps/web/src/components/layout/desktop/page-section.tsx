import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

interface PageSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Desktop section block with optional heading and actions.
 */
export function PageSection({
  title,
  description,
  actions,
  children,
  className,
}: PageSectionProps): ReactElement {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-heading">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
