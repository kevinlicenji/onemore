import { Skeleton } from '@onemore/ui';
import type { ReactElement } from 'react';

interface CardGridSkeletonProps {
  count?: number;
  columns?: '2' | '3' | '4';
}

/**
 * Skeleton grid matching desktop card layouts.
 */
export function CardGridSkeleton({
  count = 6,
  columns = '3',
}: CardGridSkeletonProps): ReactElement {
  const gridClass =
    columns === '4'
      ? 'grid-cols-2 xl:grid-cols-4'
      : columns === '2'
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-36 rounded-lg" />
      ))}
    </div>
  );
}
