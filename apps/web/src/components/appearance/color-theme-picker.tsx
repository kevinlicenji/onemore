'use client';

import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { COLOR_THEMES } from '@/lib/appearance/color-themes';

import { useAppearance } from './appearance-provider';

/**
 * Grid of full appearance presets for settings.
 */
export function ColorThemePicker(): ReactElement {
  const t = useTranslations('Settings');
  const { colorThemeId, setColorThemeId } = useAppearance();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {COLOR_THEMES.map((theme) => {
        const selected = colorThemeId === theme.id;
        return (
          <button
            key={theme.id}
            aria-label={t(`colorThemes.${theme.id}` as 'colorThemes.classic')}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl p-2 transition-transform active:scale-95',
              selected && 'bg-gym-tint ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
            type="button"
            onClick={() => {
              setColorThemeId(theme.id);
            }}
          >
            <span
              aria-hidden
              className="relative flex h-10 w-full overflow-hidden rounded-lg border shadow-sm"
              style={{ backgroundColor: theme.backgroundSwatch }}
            >
              <span
                className="absolute bottom-1 left-1 h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: theme.swatch }}
              />
              <span
                className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: theme.accentSwatch }}
              />
            </span>
            <span className="text-center text-[0.65rem] font-medium leading-tight text-muted-foreground">
              {t(`colorThemes.${theme.id}` as 'colorThemes.classic')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
