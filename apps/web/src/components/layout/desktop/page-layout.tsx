import { cn } from '@onemore/ui';
import type { ReactElement, ReactNode } from 'react';

type PageLayoutVariant = 'default' | 'wide' | 'centered';

interface PageLayoutProps {
  children: ReactNode;
  variant?: PageLayoutVariant;
  className?: string;
}

const variantClasses: Record<PageLayoutVariant, string> = {
  default: 'mx-auto w-full max-w-6xl',
  wide: 'mx-auto w-full max-w-full',
  centered: 'mx-auto w-full max-w-md min-h-screen justify-center',
};

/**
 * Desktop page container with consistent padding and max-width per variant.
 */
export function PageLayout({
  children,
  variant = 'default',
  className,
}: PageLayoutProps): ReactElement {
  return (
    <main className={cn('flex flex-col gap-8 p-8', variantClasses[variant], className)}>
      {children}
    </main>
  );
}
