'use client';

import { Button } from '@onemore/ui';

interface NumberStepperProps {
  label: string;
  value: number | null;
  placeholder?: string;
  step: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number | null) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
  const steps = Math.round((value + Number.EPSILON) / step);
  const decimals = step % 1 === 0 ? 0 : 1;
  return Number((steps * step).toFixed(decimals));
}

/**
 * Touch-friendly numeric input with increment/decrement controls.
 */
export function NumberStepper({
  label,
  value,
  placeholder,
  step,
  min = 0,
  max = 500,
  disabled = false,
  onChange,
}: NumberStepperProps): React.ReactElement {
  const displayValue = value === null ? '' : String(value);

  function applyDelta(delta: number): void {
    if (disabled) {
      return;
    }
    const base = value ?? 0;
    onChange(clamp(roundToStep(base + delta, step), min, max));
  }

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <Button
          aria-label={`${label} -`}
          className="min-h-11 min-w-11 shrink-0 px-0"
          disabled={disabled}
          type="button"
          variant="outline"
          onClick={() => {
            applyDelta(-step);
          }}
        >
          −
        </Button>
        <input
          aria-label={label}
          className="min-h-11 w-full rounded-md border px-2 text-center text-sm"
          disabled={disabled}
          inputMode="decimal"
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
              onChange(clamp(parsed, min, max));
            }
          }}
        />
        <Button
          aria-label={`${label} +`}
          className="min-h-11 min-w-11 shrink-0 px-0"
          disabled={disabled}
          type="button"
          variant="outline"
          onClick={() => {
            applyDelta(step);
          }}
        >
          +
        </Button>
      </div>
    </label>
  );
}
