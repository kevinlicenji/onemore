'use client';

import { formatTargetRepsLabel, TARGET_REPS_TO_FAILURE } from '@onemore/shared';
import { Button } from '@onemore/ui';

import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  METRIC_REST_MAX,
  METRIC_REST_MIN,
  METRIC_REST_STEP,
  METRIC_SETS_MAX,
  METRIC_SETS_MIN,
  METRIC_WEIGHT_MAX,
  METRIC_WEIGHT_MIN,
  METRIC_WEIGHT_STEP,
  REPS_PRESCRIPTION_WHEEL_VALUES,
  REST_WHEEL_VALUES,
  SETS_WHEEL_VALUES,
  WEIGHT_WHEEL_VALUES,
  buildWeightWheelValuesAround,
} from '@/lib/metric-picker-config';
import { buildNumericWheelValues } from '@/lib/scroll-wheel-snap';

import { ScrollWheelPicker, type ScrollWheelPickerOption } from './scroll-wheel-picker';

import type { ScrollWheelPickerSize } from './scroll-wheel-picker';

export type MetricInputKind = 'sets' | 'reps' | 'repsPrescription' | 'weight' | 'rest';

type MetricInputSize = 'default' | 'gym';

interface MetricInputProps {
  kind: MetricInputKind;
  label: string;
  value: number | null;
  failureLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: MetricInputSize;
  wheelSize?: ScrollWheelPickerSize;
  showLabel?: boolean;
  /** Centers the weight wheel around this value on mobile (smaller, faster scroll). */
  wheelCenterKg?: number;
  onChange: (value: number | null) => void;
}

const sizeClasses: Record<MetricInputSize, { label: string; button: string; input: string }> = {
  default: {
    label: 'text-xs',
    button: 'min-h-11 min-w-11 text-sm',
    input: 'min-h-11 text-sm',
  },
  gym: {
    label: 'text-xs font-medium',
    button: 'min-h-11 min-w-11 text-lg',
    input: 'min-h-11 text-lg font-semibold',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
  const steps = Math.round((value + Number.EPSILON) / step);
  const decimals = step % 1 === 0 ? 0 : 1;
  return Number((steps * step).toFixed(decimals));
}

function getBounds(kind: MetricInputKind): { min: number; max: number; step: number } {
  switch (kind) {
    case 'sets':
      return { min: METRIC_SETS_MIN, max: METRIC_SETS_MAX, step: 1 };
    case 'reps':
      return { min: 0, max: 100, step: 1 };
    case 'repsPrescription':
      return { min: 0, max: 25, step: 1 };
    case 'weight':
      return { min: METRIC_WEIGHT_MIN, max: METRIC_WEIGHT_MAX, step: METRIC_WEIGHT_STEP };
    case 'rest':
      return { min: METRIC_REST_MIN, max: METRIC_REST_MAX, step: METRIC_REST_STEP };
  }
}

function buildWheelOptions(
  kind: MetricInputKind,
  failureLabel: string,
  wheelCenterKg?: number,
): ScrollWheelPickerOption<number>[] {
  if (kind === 'repsPrescription') {
    return REPS_PRESCRIPTION_WHEEL_VALUES.map((value) => ({
      value,
      label:
        value === TARGET_REPS_TO_FAILURE
          ? failureLabel
          : formatTargetRepsLabel(value, failureLabel),
    }));
  }
  if (kind === 'weight') {
    const values =
      wheelCenterKg !== undefined
        ? buildWeightWheelValuesAround(wheelCenterKg)
        : WEIGHT_WHEEL_VALUES;
    return values.map((value) => ({ value, label: String(value) }));
  }
  if (kind === 'rest') {
    return REST_WHEEL_VALUES.map((value) => ({ value, label: String(value) }));
  }
  if (kind === 'sets') {
    return SETS_WHEEL_VALUES.map((value) => ({ value, label: String(value) }));
  }
  const { min, max, step } = getBounds(kind);
  return buildNumericWheelValues(min, max, step).map((value) => ({
    value,
    label: String(value),
  }));
}

/**
 * Unified numeric field: scroll wheel on mobile, stepper on desktop.
 */
export function MetricInput({
  kind,
  label,
  value,
  failureLabel = 'Cedimento',
  placeholder,
  disabled = false,
  size = 'default',
  wheelSize,
  showLabel = true,
  wheelCenterKg,
  onChange,
}: MetricInputProps): React.ReactElement {
  const isDesktop = useIsDesktop();
  const classes = sizeClasses[size];
  const { min, max, step } = getBounds(kind);
  const displayValue = value === null ? '' : String(value);
  const wheelValue =
    value ?? (kind === 'weight' && wheelCenterKg !== undefined ? wheelCenterKg : min);
  const useWheel = isDesktop === false;
  const resolvedWheelSize = wheelSize ?? (size === 'gym' ? 'workout' : 'default');

  function applyDelta(delta: number): void {
    if (disabled) {
      return;
    }
    const base = value ?? min;
    onChange(clamp(roundToStep(base + delta, step), min, max));
  }

  if (useWheel) {
    return (
      <ScrollWheelPicker
        disabled={disabled}
        label={label}
        options={buildWheelOptions(kind, failureLabel, wheelCenterKg)}
        showLabel={showLabel}
        size={resolvedWheelSize}
        value={wheelValue}
        onChange={(nextValue) => {
          onChange(nextValue);
        }}
      />
    );
  }

  if (kind === 'repsPrescription') {
    const options = buildWheelOptions(kind, failureLabel);
    return (
      <label className={`flex flex-col gap-2 ${classes.label}`}>
        {showLabel ? <span>{label}</span> : null}
        <select
          className={`rounded-md border bg-background px-2 ${classes.input}`}
          disabled={disabled}
          value={wheelValue}
          onChange={(event) => {
            onChange(Number(event.target.value));
          }}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className={`flex flex-col gap-2 ${classes.label}`} data-no-swipe>
      {showLabel ? <span>{label}</span> : null}
      <div className="flex items-center gap-2">
        <Button
          aria-label={`${label} -`}
          className={`shrink-0 px-0 ${classes.button}`}
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
          className={`w-full rounded-md border bg-background px-2 text-center ${classes.input}`}
          disabled={disabled}
          inputMode="decimal"
          placeholder={placeholder}
          type="number"
          value={displayValue}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === '') {
              onChange(null);
              return;
            }
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) {
              onChange(clamp(roundToStep(parsed, step), min, max));
            }
          }}
        />
        <Button
          aria-label={`${label} +`}
          className={`shrink-0 px-0 ${classes.button}`}
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
