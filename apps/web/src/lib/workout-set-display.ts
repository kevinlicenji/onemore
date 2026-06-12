import { formatTargetRepsLabel } from '@onemore/shared';

/**
 * Formatting helpers for prescribed and logged workout sets.
 */
export function formatPrescribedWeight(targetWeightKg: number | null): string {
  if (targetWeightKg !== null) {
    return String(targetWeightKg);
  }
  return '—';
}

/**
 * @returns Prescription line such as `10 x 60kg (90')`.
 */
export function formatSetPrescriptionLine(
  targetReps: number,
  targetWeightKg: number | null,
  restSeconds: number,
  failureLabel = 'Cedimento',
): string {
  const repsPart = formatTargetRepsLabel(targetReps, failureLabel);
  const weightPart = targetWeightKg !== null ? `${targetWeightKg}kg` : '—';
  return `${repsPart} x ${weightPart} (${restSeconds}')`;
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
  const weightPart = weightKg !== null ? `${weightKg}kg` : '—';
  const base = `${loggedReps} x ${weightPart}`;
  if (restSeconds === null) {
    return base;
  }
  return `${base} (${restSeconds}')`;
}

/**
 * True when the set number exceeds the prescribed set count.
 */
export function isExtraSet(setNumber: number, prescribedSets: number): boolean {
  return setNumber > prescribedSets;
}
