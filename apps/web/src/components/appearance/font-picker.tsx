'use client';

import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';

import { FONT_OPTIONS } from '@/lib/appearance/font-options';

import { useAppearance } from './appearance-provider';

/**
 * Selectable list of app fonts with live preview labels.
 */
export function FontPicker(): React.ReactElement {
  const t = useTranslations('Settings');
  const { fontId, setFontId } = useAppearance();

  return (
    <ul className="flex flex-col overflow-hidden rounded-2xl border bg-gym-surface">
      {FONT_OPTIONS.map((option, index) => {
        const selected = fontId === option.id;
        return (
          <li
            key={option.id}
            className={cn(index > 0 && 'border-t border-gym-separator')}
          >
            <button
              aria-pressed={selected}
              className={cn(
                'flex w-full min-h-12 items-center justify-between px-4 py-3 text-left transition-colors active:bg-muted/60',
                selected && 'bg-primary/8 text-primary',
              )}
              style={{ fontFamily: option.previewFamily }}
              type="button"
              onClick={() => {
                setFontId(option.id);
              }}
            >
              <span className="font-medium">{t(`fonts.${option.id}` as 'fonts.plus-jakarta')}</span>
              {selected ? (
                <span aria-hidden className="text-sm">
                  ✓
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
