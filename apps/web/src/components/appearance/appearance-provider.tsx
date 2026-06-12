'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  applyAppearanceToDocument,
  type AppearanceAttributes,
} from '@/lib/appearance/apply-appearance';
import {
  getDefaultAppearancePreferences,
  readAppearancePreferences,
  writeAppearancePreferences,
} from '@/lib/appearance/appearance-storage';
import type { ColorThemeId } from '@/lib/appearance/color-themes';
import type { FontId } from '@/lib/appearance/font-options';

interface AppearanceContextValue {
  colorThemeId: ColorThemeId;
  fontId: FontId;
  setColorThemeId: (id: ColorThemeId) => void;
  setFontId: (id: FontId) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

interface AppearanceProviderProps {
  children: ReactNode;
}

/**
 * Persists and applies user color-theme and font preferences on the document root.
 */
export function AppearanceProvider({ children }: AppearanceProviderProps): ReactElement {
  const [preferences, setPreferences] = useState<AppearanceAttributes>(
    getDefaultAppearancePreferences,
  );

  useEffect(() => {
    const stored = readAppearancePreferences();
    setPreferences(stored);
    applyAppearanceToDocument(stored);
  }, []);

  const persist = useCallback((patch: Partial<AppearanceAttributes>): void => {
    setPreferences((previous) => {
      const next = { ...previous, ...patch };
      applyAppearanceToDocument(next);
      writeAppearancePreferences(next);
      return next;
    });
  }, []);

  const setColorThemeId = useCallback(
    (colorThemeId: ColorThemeId): void => {
      persist({ colorThemeId });
    },
    [persist],
  );

  const setFontId = useCallback(
    (fontId: FontId): void => {
      persist({ fontId });
    },
    [persist],
  );

  const value = useMemo(
    (): AppearanceContextValue => ({
      colorThemeId: preferences.colorThemeId,
      fontId: preferences.fontId,
      setColorThemeId,
      setFontId,
    }),
    [preferences.colorThemeId, preferences.fontId, setColorThemeId, setFontId],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

/**
 * @returns Appearance context for theme and font pickers.
 * @throws When used outside AppearanceProvider.
 */
export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return context;
}
