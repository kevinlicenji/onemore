'use client';

import { cn } from '@onemore/ui';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { GymSheet } from './gym-sheet';

export interface GymPickerOption {
  value: string;
  label: string;
}

interface GymPickerFieldProps {
  label: string;
  value: string;
  options: GymPickerOption[];
  sheetTitle?: string;
  onChange: (value: string) => void;
}

/**
 * Mobile filter field that opens a bottom sheet option list instead of a native select.
 */
export function GymPickerField({
  label,
  value,
  options,
  sheetTitle,
  onChange,
}: GymPickerFieldProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <>
      <button
        className="flex min-h-12 w-full flex-col items-start rounded-2xl border border-gym-separator bg-gym-surface px-4 py-2.5 text-left shadow-sm transition-colors active:bg-muted/40"
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="mt-0.5 flex w-full items-center justify-between gap-2">
          <span className="font-medium">{selected?.label}</span>
          <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground/70" />
        </span>
      </button>

      <GymSheet
        ariaLabel={sheetTitle ?? label}
        open={open}
        title={sheetTitle ?? label}
        onClose={() => {
          setOpen(false);
        }}
      >
        <ul className="overflow-hidden rounded-2xl border border-gym-separator bg-gym-surface">
          {options.map((option, index) => {
            const active = option.value === value;
            return (
              <li key={option.value} className={cn(index > 0 && 'border-t border-gym-separator')}>
                <button
                  className={cn(
                    'flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-base transition-colors active:bg-muted/50',
                    active && 'bg-primary/8 font-medium text-primary',
                  )}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {active ? <span aria-hidden>✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </GymSheet>
    </>
  );
}
