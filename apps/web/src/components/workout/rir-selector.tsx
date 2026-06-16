'use client';

import { cn } from '@onemore/ui';

interface RirSelectorProps {
  value: number | null;
  disabled?: boolean;
  label: string;
  onChange: (rir: number | null) => void;
}

const RIR_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

/**
 * Compact RIR (reps in reserve) picker for working sets.
 */
export function RirSelector({
  value,
  disabled = false,
  label,
  onChange,
}: RirSelectorProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {RIR_OPTIONS.map((rir) => (
          <button
            key={rir}
            className={cn(
              'min-h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition-colors',
              value === rir
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-gym-separator bg-background text-foreground',
              disabled && 'pointer-events-none opacity-50',
            )}
            disabled={disabled}
            type="button"
            onClick={() => {
              onChange(rir);
            }}
          >
            {rir}
          </button>
        ))}
        <button
          className={cn(
            'min-h-9 rounded-lg border px-2 text-xs font-medium text-muted-foreground',
            value === null && 'border-primary/40 bg-muted/50',
            disabled && 'pointer-events-none opacity-50',
          )}
          disabled={disabled}
          type="button"
          onClick={() => {
            onChange(null);
          }}
        >
          —
        </button>
      </div>
    </div>
  );
}
