import type { HTMLAttributes, ReactElement } from 'react';

import { cn } from '../lib/utils.js';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/**
 * Placeholder shimmer block for loading states.
 */
export function Skeleton({ className, ...props }: SkeletonProps): ReactElement {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden {...props} />
  );
}
