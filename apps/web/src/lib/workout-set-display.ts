import { formatTargetRepsLabel } from '@onemore/shared';

/**
 * Formatting helpers for prescribed and logged workout sets.
 */
export function formatPrescribedWeight(
  targetWeightKg: number | null,
  prescriptionMode?: {
    weightPrescriptionMode?: string | null;
    targetPercentOfMax?: number | null;
  } | null,
): string {
  if (
    prescriptionMode?.weightPrescriptionMode === 'percent_of_max' &&
    prescriptionMode?.targetPercentOfMax != null
  ) {
    return `${prescriptionMode.targetPercentOfMax}%`;
  }
  if (targetWeightKg !== null) {
    return String(targetWeightKg);
  }
  return '—';
}

/**
 * @returns Prescription line such as `10 x 60kg (90')` or `10 @ 85% (90')`.
 */
export function formatSetPrescriptionLine(
  targetReps: number,
  targetWeightKg: number | null,
  restSeconds: number,
  failureLabel = 'Cedimento',
  prescriptionMode?: {
    weightPrescriptionMode?: string | null;
    targetPercentOfMax?: number | null;
  } | null,
): string {
  const repsPart = formatTargetRepsLabel(targetReps, failureLabel);
  const isPercent = prescriptionMode?.weightPrescriptionMode === 'percent_of_max';
  const weightPart = isPercent
    ? formatPrescribedWeight(targetWeightKg, prescriptionMode)
    : targetWeightKg !== null
      ? `${String(targetWeightKg)}kg`
      : '—';
  const joiner = isPercent ? ' @ ' : ' x ';
  return `${repsPart}${joiner}${weightPart} (${String(restSeconds)}')`;
}

/**
 * @returns Logged set line with optional actual rest seconds.
 */
export function formatLoggedSetLine(
  reps: number | null,
  weightKg: number | null,
  restSeconds: number | null,
  targetReps: number,
): string {
  const loggedReps = reps ?? targetReps;
  const weightPart = weightKg !== null ? `${String(weightKg)}kg` : '—';
  const base = `${String(loggedReps)} x ${weightPart}`;
  if (restSeconds === null) {
    return base;
  }
  return `${base} (${String(restSeconds)}')`;
}

/**
 * True when the set number exceeds the prescribed set count.
 */
export function isExtraSet(setNumber: number, prescribedSets: number): boolean {
  return setNumber > prescribedSets;
}

/**
 * @returns Last execution summary such as `3 x 10 x 70kg`.
 */
export function formatLastExecutionLine(
  setsCount: number,
  reps: number | null,
  weightKg: number | null,
  failureLabel = 'Cedimento',
): string | null {
  if (setsCount <= 0) {
    return null;
  }
  const repsPart = reps !== null ? formatTargetRepsLabel(reps, failureLabel) : failureLabel;
  const weightPart = weightKg !== null ? `${String(weightKg)}kg` : '—';
  return `${String(setsCount)} x ${repsPart} x ${weightPart}`;
}

/**
 * @returns Compact prescription for set header such as `5 x 15 x 60kg (90')` or `5 x 10 @ 85% (90')`.
 */
export function formatSetTargetInline(
  targetSets: number,
  targetReps: number,
  targetWeightKg: number | null,
  restSeconds: number,
  failureLabel = 'Cedimento',
  prescriptionMode?: {
    weightPrescriptionMode?: string | null;
    targetPercentOfMax?: number | null;
  } | null,
): string {
  const repsPart = formatTargetRepsLabel(targetReps, failureLabel);
  const isPercent = prescriptionMode?.weightPrescriptionMode === 'percent_of_max';
  const weightPart = isPercent
    ? formatPrescribedWeight(targetWeightKg, prescriptionMode)
    : targetWeightKg !== null
      ? `${String(targetWeightKg)}kg`
      : '—';
  const joiner = isPercent ? ' @ ' : ' x ';
  return `${String(targetSets)} x ${repsPart}${joiner}${weightPart} (${String(restSeconds)}')`;
}

/**
 * @returns Previous-session benchmark line such as `80 kg × 10`, or null when unknown.
 */
export function formatPreviousSetLine(
  weightKg: number | null,
  reps: number | null,
  failureLabel: string,
): string | null {
  if (reps === null && weightKg === null) {
    return null;
  }
  const repsPart = reps !== null ? formatTargetRepsLabel(reps, failureLabel) : failureLabel;
  const weightPart = weightKg !== null ? `${String(weightKg)} kg` : '—';
  return `${weightPart} × ${repsPart}`;
}
