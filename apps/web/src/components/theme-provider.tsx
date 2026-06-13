'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app with a stable light class; color themes own contrast via data-color-theme.
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      forcedTheme="light"
    >
      {children}
    </NextThemesProvider>
  );
}
