import { formatTargetRepsLabel } from '@onemore/shared';

/**
 * Compact program exercise line, e.g. `3 x 8 x 25 kg (90')`.
 */
export function formatProgramExerciseSummary(
  targetSets: number,
  targetReps: number,
  targetWeightKg: number | null,
  restSeconds: number,
  failureLabel: string,
): string {
  const repsPart = formatTargetRepsLabel(targetReps, failureLabel);
  const weightPart = targetWeightKg !== null ? `${String(targetWeightKg)} kg` : '—';
  return `${String(targetSets)} x ${repsPart} x ${weightPart} (${String(restSeconds)}')`;
}
