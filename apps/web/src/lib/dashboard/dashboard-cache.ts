import type { AnalyticsDashboard } from '@onemore/shared';
import { computeDashboardKpis } from '@onemore/shared';

import { historySummaryToDashboardInput } from '@/lib/offline/dashboard-store';
import { offlineDb } from '@/lib/offline/db';

export interface DashboardLoadContext {
  timezone: string;
  locale: string;
  trainingDaysPerWeek: number | null;
}

let cachedDashboard: AnalyticsDashboard | null = null;
let cacheKey: string | null = null;

/**
 * Build a cache key from profile context and local row counts.
 *
 * @param context - User profile fields affecting KPI computation.
 */
async function buildCacheKey(context: DashboardLoadContext): Promise<string> {
  const [sessionCount, prCount, nextWorkout] = await Promise.all([
    offlineDb.completedSessions.count(),
    offlineDb.personalRecords.count(),
    offlineDb.nextWorkout.get('default'),
  ]);
  return [
    context.timezone,
    context.locale,
    String(context.trainingDaysPerWeek ?? 'null'),
    String(sessionCount),
    String(prCount),
    nextWorkout?.workoutDayId ?? 'none',
    nextWorkout?.programAssignmentId ?? 'none',
  ].join(':');
}

/**
 * Invalidate the in-memory dashboard KPI cache.
 */
export function invalidateDashboardCache(): void {
  cachedDashboard = null;
  cacheKey = null;
}

/**
 * Load dashboard KPIs from IndexedDB with in-memory caching.
 *
 * @param context - User profile fields affecting KPI computation.
 */
export async function loadDashboardKpisFromLocal(
  context: DashboardLoadContext,
): Promise<AnalyticsDashboard> {
  const nextCacheKey = await buildCacheKey(context);
  if (cachedDashboard && cacheKey === nextCacheKey) {
    return cachedDashboard;
  }

  const [summaries, personalRecords, nextWorkout] = await Promise.all([
    offlineDb.completedSessions.orderBy('completedAt').reverse().toArray(),
    offlineDb.personalRecords.orderBy('achievedAt').reverse().toArray(),
    offlineDb.nextWorkout.get('default'),
  ]);

  const sessions = summaries
    .map((summary) => historySummaryToDashboardInput(summary))
    .filter((session): session is NonNullable<typeof session> => session !== null);

  const dashboard = computeDashboardKpis({
    timezone: context.timezone,
    locale: context.locale,
    trainingDaysPerWeek: context.trainingDaysPerWeek,
    nextWorkout: nextWorkout ?? {
      hasActiveAssignment: false,
      programAssignmentId: null,
      workoutDayId: null,
      workoutDayLabel: null,
      exerciseCount: 0,
      programName: null,
      exercises: [],
      days: [],
    },
    sessions,
    personalRecords,
  });

  cachedDashboard = dashboard;
  cacheKey = nextCacheKey;
  return dashboard;
}
