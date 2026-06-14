import type { HistorySessionSummary, PersonalRecordSummary, WorkoutSessionDetail } from '@onemore/shared';
import type { DashboardSessionInput } from '@onemore/shared';

import { computeWorkoutSessionStats } from '@/lib/workout-stats';

import { emitDashboardInvalidation } from '@/lib/dashboard/dashboard-events';
import { invalidateDashboardCache } from '@/lib/dashboard/dashboard-cache';

import { offlineDb } from './db';

/**
 * Convert a completed workout session detail into a history summary row.
 *
 * @param session - Completed workout session with exercises and sets.
 */
export function sessionDetailToHistorySummary(
  session: WorkoutSessionDetail,
): HistorySessionSummary {
  const stats = computeWorkoutSessionStats(session);
  return {
    id: session.id,
    status: session.status,
    sessionType: session.sessionType,
    workoutDayLabel: session.workoutDayLabel,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    durationSeconds: session.durationSeconds,
    exerciseCount: stats.exerciseCount,
    totalSets: stats.completedSets,
    totalVolumeKg: stats.totalVolumeKg,
  };
}

/**
 * Map a stored history summary into dashboard KPI session input.
 *
 * @param summary - Completed session summary from IndexedDB.
 */
export function historySummaryToDashboardInput(
  summary: HistorySessionSummary,
): DashboardSessionInput | null {
  if (!summary.completedAt || summary.status !== 'completed') {
    return null;
  }

  return {
    id: summary.id,
    completedAt: summary.completedAt,
    sessionType: summary.sessionType,
    workoutDayId: null,
    workoutDayLabel: summary.workoutDayLabel,
    totalSets: summary.totalSets,
    totalVolumeKg: summary.totalVolumeKg,
  };
}

/**
 * Upsert a completed session summary for dashboard KPI computation.
 *
 * @param session - Completed workout session detail.
 */
export async function upsertCompletedSessionSummary(
  session: WorkoutSessionDetail,
): Promise<void> {
  if (session.status !== 'completed' || !session.completedAt) {
    return;
  }
  await offlineDb.completedSessions.put(sessionDetailToHistorySummary(session));
}

/**
 * Remove a completed session summary after history deletion.
 *
 * @param sessionId - Deleted session id.
 */
export async function removeCompletedSessionSummary(sessionId: string): Promise<void> {
  await offlineDb.completedSessions.delete(sessionId);
}

/**
 * Persist personal records earned during a set log to IndexedDB.
 *
 * @param records - Newly achieved personal records.
 */
export async function persistPersonalRecords(records: PersonalRecordSummary[]): Promise<void> {
  if (records.length === 0) {
    return;
  }
  await offlineDb.personalRecords.bulkPut(records);
}

/**
 * Refresh dashboard cache after a workout is deleted from history.
 *
 * @param sessionId - Deleted session id.
 */
export async function notifyDashboardWorkoutDeleted(sessionId: string): Promise<void> {
  await removeCompletedSessionSummary(sessionId);
  invalidateDashboardCache();
  emitDashboardInvalidation('WORKOUT_DELETED');
}

/**
 * Refresh dashboard cache after a completed workout is edited.
 *
 * @param session - Updated completed session detail.
 */
export async function notifyDashboardWorkoutEdited(session: WorkoutSessionDetail): Promise<void> {
  await upsertCompletedSessionSummary(session);
  invalidateDashboardCache();
  emitDashboardInvalidation('WORKOUT_EDITED');
}
