'use client';

import { Skeleton } from '@onemore/ui';

import { useIsDesktop } from '@/hooks/use-is-desktop';

/**
 * Placeholder shown while viewport mode is resolving or page data is loading.
 */
export function PageLoadingSkeleton(): React.ReactElement {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="mt-4 h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col gap-8 p-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
    </div>
  );
}
