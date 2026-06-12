'use client';

type SetMetricInputSize = 'md' | 'sm' | 'xs';

interface SetMetricInputProps {
  value: number | null;
  placeholder: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  inputMode?: 'decimal' | 'numeric';
  size?: SetMetricInputSize;
  className?: string;
  onChange: (value: number | null) => void;
}

const sizeClasses: Record<SetMetricInputSize, string> = {
  md: 'min-h-11 text-sm px-2',
  sm: 'min-h-8 text-xs px-1.5',
  xs: 'min-h-7 text-[11px] px-1',
};

/**
 * Compact numeric field for workout set logging (no stepper buttons).
 */
export function SetMetricInput({
  value,
  placeholder,
  disabled = false,
  min = 0,
  max = 500,
  inputMode = 'decimal',
  size = 'md',
  className = '',
  onChange,
}: SetMetricInputProps): React.ReactElement {
  const displayValue = value === null ? '' : String(value);

  return (
    <input
      className={`w-full rounded-md border bg-background text-center disabled:bg-muted/30 disabled:text-muted-foreground ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      inputMode={inputMode}
      placeholder={placeholder}
      type="number"
      value={displayValue}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') {
          onChange(null);
          return;
        }
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) {
          onChange(Math.min(max, Math.max(min, parsed)));
        }
      }}
    />
  );
}
