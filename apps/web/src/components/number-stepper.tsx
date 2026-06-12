'use client';

import { MetricInput, type MetricInputKind } from '@/components/metric-input';

type NumberStepperSize = 'default' | 'gym';

interface NumberStepperProps {
  label: string;
  value: number | null;
  placeholder?: string;
  step: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: NumberStepperSize;
  kind?: MetricInputKind;
  onChange: (value: number | null) => void;
}

function inferKind(step: number): MetricInputKind {
  if (step === 0.5) {
    return 'weight';
  }
  if (step === 5) {
    return 'rest';
  }
  return 'reps';
}

/**
 * Touch-friendly numeric input; delegates to MetricInput (wheel on mobile).
 */
export function NumberStepper({
  label,
  value,
  placeholder,
  step,
  disabled = false,
  size = 'default',
  kind,
  onChange,
}: NumberStepperProps): React.ReactElement {
  return (
    <MetricInput
      disabled={disabled}
      kind={kind ?? inferKind(step)}
      label={label}
      placeholder={placeholder}
      size={size}
      value={value}
      onChange={onChange}
    />
  );
}
