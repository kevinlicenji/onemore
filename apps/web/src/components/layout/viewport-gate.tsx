'use client';

import { Skeleton } from '@onemore/ui';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

interface ViewportGateProps {
  desktop: ReactNode;
  mobile: ReactNode;
}

const DESKTOP_MEDIA = '(min-width: 1024px)';

/**
 * Mobile shell skeleton shown while viewport mode resolves.
 */
function MobileShellSkeleton(): ReactElement {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <div className="border-b border-gym-separator px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 pb-[env(safe-area-inset-bottom)]">
        <Skeleton className="mx-auto h-16 max-w-lg" />
      </div>
    </div>
  );
}

/**
 * Renders desktop or mobile shell based on viewport width (lg breakpoint).
 */
export function ViewportGate({ desktop, mobile }: ViewportGateProps): ReactElement {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const update = (): void => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (isDesktop === null) {
    return <MobileShellSkeleton />;
  }

  return <>{isDesktop ? desktop : mobile}</>;
}
