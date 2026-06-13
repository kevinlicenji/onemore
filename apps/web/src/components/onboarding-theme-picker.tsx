'use client';

import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { COLOR_THEMES, type ColorThemeId } from '@/lib/appearance/color-themes';

interface OnboardingThemePickerProps {
  selectedId: ColorThemeId;
  onSelect: (id: ColorThemeId) => void;
}

/**
 * Large theme cards for onboarding — live preview via `data-color-theme` on the document.
 */
export function OnboardingThemePicker({
  selectedId,
  onSelect,
}: OnboardingThemePickerProps): ReactElement {
  const t = useTranslations('Onboarding');

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {COLOR_THEMES.map((theme) => {
        const selected = selectedId === theme.id;
        return (
          <button
            key={theme.id}
            aria-pressed={selected}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99]',
              selected ? 'border-primary bg-gym-tint ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-muted/40',
            )}
            type="button"
            onClick={() => {
              onSelect(theme.id);
            }}
          >
            <span
              aria-hidden
              className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-lg border shadow-sm"
              style={{ backgroundColor: theme.backgroundSwatch }}
            >
              <span
                className="absolute bottom-1 left-1 h-4 w-4 rounded-full"
                style={{ backgroundColor: theme.swatch }}
              />
              <span
                className="absolute right-1 top-1 h-3 w-3 rounded-full"
                style={{ backgroundColor: theme.accentSwatch }}
              />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{t(`themes.${theme.id}.title`)}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {t(`themes.${theme.id}.description`)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
