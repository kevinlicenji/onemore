'use client';

import { useEffect, useState } from 'react';

import { useViewportContext } from '@/components/layout/viewport-provider';
import { DESKTOP_MEDIA } from '@/lib/desktop-viewport';

/**
 * Returns true when viewport is at or above the lg breakpoint (1024px).
 * Uses {@link ViewportProvider} when present so navigations do not re-resolve.
 */
export function useIsDesktop(): boolean | null {
  const fromProvider = useViewportContext();
  const [localIsDesktop, setLocalIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (fromProvider !== undefined) {
      return;
    }

    const media = window.matchMedia(DESKTOP_MEDIA);
    const update = (): void => setLocalIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [fromProvider]);

  if (fromProvider !== undefined) {
    return fromProvider;
  }

  return localIsDesktop;
}
