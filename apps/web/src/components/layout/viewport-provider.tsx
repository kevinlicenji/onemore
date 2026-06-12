'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { DESKTOP_MEDIA } from '@/lib/desktop-viewport';

const ViewportContext = createContext<boolean | null | undefined>(undefined);

interface ViewportProviderProps {
  children: ReactNode;
}

/**
 * Resolves desktop vs mobile viewport once for the whole app tree.
 */
export function ViewportProvider({ children }: ViewportProviderProps): ReactElement {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const update = (): void => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return <ViewportContext.Provider value={isDesktop}>{children}</ViewportContext.Provider>;
}

/**
 * Reads the shared viewport mode from {@link ViewportProvider}.
 */
export function useViewportContext(): boolean | null | undefined {
  return useContext(ViewportContext);
}
