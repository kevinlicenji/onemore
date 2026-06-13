'use client';

import {
  flattenMuscleFocusSelections,
  ONBOARDING_MUSCLE_FOCUS_OPTIONS,
  type OnboardingMuscleFocusId,
} from '@onemore/shared';
import { cn } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import type { ReactElement } from 'react';

import { MuscleFocusIllustration } from '@/components/muscle-focus-illustration';

interface OnboardingMusclePickerProps {
  selected: OnboardingMuscleFocusId[];
  onChange: (selected: OnboardingMuscleFocusId[]) => void;
}

/**
 * Multi-select muscle focus cards with body illustrations for onboarding.
 */
export function OnboardingMusclePicker({
  selected,
  onChange,
}: OnboardingMusclePickerProps): ReactElement {
  const t = useTranslations('Onboarding');

  function toggleOption(id: OnboardingMuscleFocusId): void {
    if (id === 'balanced') {
      onChange(selected.includes('balanced') ? [] : ['balanced']);
      return;
    }

    const withoutBalanced = selected.filter((item) => item !== 'balanced');
    if (withoutBalanced.includes(id)) {
      onChange(withoutBalanced.filter((item) => item !== id));
      return;
    }

    onChange([...withoutBalanced, id]);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ONBOARDING_MUSCLE_FOCUS_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            aria-pressed={isSelected}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all active:scale-[0.99]',
              isSelected
                ? 'border-primary bg-gym-tint ring-2 ring-primary ring-offset-2 ring-offset-background'
                : 'hover:bg-muted/40',
            )}
            type="button"
            onClick={() => {
              toggleOption(option.id);
            }}
          >
            <MuscleFocusIllustration
              className="h-24 w-16 text-muted-foreground"
              focusId={option.id}
            />
            <span className="font-medium">{t(`muscleFocus.${option.id}.title`)}</span>
            <span className="text-xs text-muted-foreground">
              {t(`muscleFocus.${option.id}.hint`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { flattenMuscleFocusSelections };
