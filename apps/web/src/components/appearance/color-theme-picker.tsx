'use client';

import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';

import { COLOR_THEMES } from '@/lib/appearance/color-themes';

import { useAppearance } from './appearance-provider';

/**
 * Grid of color palette swatches for settings.
 */
export function ColorThemePicker(): React.ReactElement {
  const t = useTranslations('Settings');
  const { colorThemeId, setColorThemeId } = useAppearance();

  return (
    <div className="grid grid-cols-5 gap-2">
      {COLOR_THEMES.map((theme) => {
        const selected = colorThemeId === theme.id;
        return (
          <button
            key={theme.id}
            aria-label={t(`colorThemes.${theme.id}` as 'colorThemes.ocean')}
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
              className="h-9 w-9 rounded-full shadow-sm"
              style={{ backgroundColor: theme.swatch }}
            />
            <span className="text-[0.65rem] font-medium leading-tight text-muted-foreground">
              {t(`colorThemes.${theme.id}` as 'colorThemes.ocean')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
