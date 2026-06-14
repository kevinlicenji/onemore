/** Resting heart rate used when the recovery timer completes (spec: 75–80 BPM). */
export const RESTING_BPM = 77;

/**
 * Peak BPM at the start of a rest period based on logged RPE.
 *
 * @param rpe - Rate of perceived exertion (1–10), or null when not tracked.
 */
export function computePeakBpm(rpe: number | null | undefined): number {
  if (rpe === null || rpe === undefined) {
    return 150;
  }
  if (rpe >= 9) {
    return 160;
  }
  if (rpe >= 7) {
    return 140;
  }
  return 130;
}

/**
 * Estimated BPM during recovery: linear decay from peak to resting across the timer.
 *
 * @param peakBpm - BPM at timer start.
 * @param remainingSeconds - Seconds left on the countdown.
 * @param totalSeconds - Planned rest duration in seconds.
 * @param restingBpm - Target BPM at timer end (default 77).
 */
export function computeRecoveryBpm(
  peakBpm: number,
  remainingSeconds: number,
  totalSeconds: number,
  restingBpm: number = RESTING_BPM,
): number {
  if (totalSeconds <= 0) {
    return restingBpm;
  }

  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
  const progress = Math.min(1, elapsedSeconds / totalSeconds);
  const bpm = peakBpm - (peakBpm - restingBpm) * progress;
  return Math.round(bpm);
}

/**
 * CSS animation cycle duration for a heartbeat pulse (seconds per beat).
 *
 * @param bpm - Current beats per minute.
 */
export function computePulseDurationSeconds(bpm: number): number {
  const safeBpm = Math.max(40, bpm);
  return 60 / safeBpm;
}
