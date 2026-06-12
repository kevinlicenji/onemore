'use client';

import { useEffect, useState } from 'react';

import { prefersReducedMotion, REDUCED_MOTION_MEDIA } from '@/lib/reduced-motion';

/**
 * Returns true when the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = globalThis.matchMedia(REDUCED_MOTION_MEDIA);
    const update = (): void => setReduced(prefersReducedMotion());
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}
