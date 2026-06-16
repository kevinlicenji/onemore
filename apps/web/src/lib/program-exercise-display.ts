import { formatTargetRepsLabel } from '@onemore/shared';

/**
 * Compact program exercise line, e.g. `3 x 8 x 25 kg (90')` or `3 x 10 @ 85% (90')`.
 */
export function formatProgramExerciseSummary(
  targetSets: number,
  targetReps: number,
  targetWeightKg: number | null,
  restSeconds: number,
  failureLabel: string,
  weightPrescriptionMode?: string | null,
  targetPercentOfMax?: number | null,
): string {
  const repsPart = formatTargetRepsLabel(targetReps, failureLabel);
  if (weightPrescriptionMode === 'percent_of_max' && targetPercentOfMax != null) {
    return `${String(targetSets)} x ${repsPart} @ ${String(targetPercentOfMax)}% (${String(restSeconds)}')`;
  }
  const weightPart = targetWeightKg !== null ? `${String(targetWeightKg)} kg` : '—';
  return `${String(targetSets)} x ${repsPart} x ${weightPart} (${String(restSeconds)}')`;
}
