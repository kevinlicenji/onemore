'use client';

import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type AppearanceMode = 'light' | 'dark' | 'system';

const MODES: AppearanceMode[] = ['system', 'light', 'dark'];

/**
 * Segmented control for light / dark / system appearance mode.
 */
export function AppearanceModePicker(): React.ReactElement {
  const t = useTranslations('Settings');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-11 rounded-xl bg-muted/40" />;
  }

  const active = (theme ?? 'system') as AppearanceMode;

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/30 p-1"
      role="group"
      aria-label={t('appearanceModeLabel')}
    >
      {MODES.map((mode) => (
        <button
          key={mode}
          aria-pressed={active === mode}
          className={cn(
            'min-h-10 rounded-lg text-sm font-medium transition-all active:scale-[0.98]',
            active === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
          )}
          type="button"
          onClick={() => {
            setTheme(mode);
          }}
        >
          {t(`appearanceModes.${mode}` as 'appearanceModes.system')}
        </button>
      ))}
    </div>
  );
}
