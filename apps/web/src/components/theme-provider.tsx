'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app with class-based light/dark/system theme switching.
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
