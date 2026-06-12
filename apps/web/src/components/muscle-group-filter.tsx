'use client';

import { MUSCLE_GROUPS, type MuscleGroup } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';

interface MuscleGroupFilterProps {
  value: MuscleGroup | '';
  onChange: (muscle: MuscleGroup | '') => void;
}

/**
 * Chip row to filter exercises by muscle group tag.
 */
export function MuscleGroupFilter({ value, onChange }: MuscleGroupFilterProps): React.ReactElement {
  const t = useTranslations('MuscleGroups');

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        className="min-h-9"
        size="sm"
        type="button"
        variant={value === '' ? 'default' : 'outline'}
        onClick={() => {
          onChange('');
        }}
      >
        {t('filterAll')}
      </Button>
      {MUSCLE_GROUPS.map((group) => (
        <Button
          key={group}
          className="min-h-9"
          size="sm"
          type="button"
          variant={value === group ? 'default' : 'outline'}
          onClick={() => {
            onChange(value === group ? '' : group);
          }}
        >
          {t(group)}
        </Button>
      ))}
    </div>
  );
}
