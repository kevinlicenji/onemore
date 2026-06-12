'use client';

import { MUSCLE_GROUPS, type MuscleGroup } from '@onemore/shared';
import { useTranslations } from 'next-intl';

interface MuscleTagPickerProps {
  value: MuscleGroup[];
  onChange: (tags: MuscleGroup[]) => void;
  maxTags?: number;
}

/**
 * Multi-select muscle tags for custom exercises (min 1, max 3).
 */
export function MuscleTagPicker({
  value,
  onChange,
  maxTags = 3,
}: MuscleTagPickerProps): React.ReactElement {
  const t = useTranslations('MuscleGroups');

  function toggleTag(tag: MuscleGroup): void {
    if (value.includes(tag)) {
      onChange(value.filter((item) => item !== tag));
      return;
    }
    if (value.length >= maxTags) {
      return;
    }
    onChange([...value, tag]);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{t('pickerLabel')}</p>
      <p className="text-xs text-muted-foreground">{t('pickerHint', { max: maxTags })}</p>
      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUPS.map((group) => {
          const selected = value.includes(group);
          const disabled = !selected && value.length >= maxTags;
          return (
            <button
              key={group}
              className={`rounded-full border px-3 py-1 text-xs ${
                selected ? 'border-primary bg-primary/10 text-primary' : 'text-foreground'
              } ${disabled ? 'opacity-40' : ''}`}
              disabled={disabled}
              type="button"
              onClick={() => {
                toggleTag(group);
              }}
            >
              {t(group)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
