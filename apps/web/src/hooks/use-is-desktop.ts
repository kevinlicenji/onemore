'use client';

import { useEffect, useState } from 'react';

const DESKTOP_MEDIA = '(min-width: 1024px)';

/**
 * Returns true when viewport is at or above the lg breakpoint (1024px).
 */
export function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const update = (): void => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return isDesktop;
}
