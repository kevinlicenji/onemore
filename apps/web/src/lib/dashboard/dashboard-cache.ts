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
let cacheVersion = 0;
let loadingPromise: Promise<AnalyticsDashboard> | null = null;

/**
 * Invalidate the in-memory dashboard KPI cache.
 */
export function invalidateDashboardCache(): void {
  cachedDashboard = null;
  cacheVersion += 1;
  loadingPromise = null;
}

/**
 * Load dashboard KPIs from IndexedDB with in-memory caching.
 * Uses a version counter and promise deduplication to prevent race conditions.
 *
 * @param context - User profile fields affecting KPI computation.
 */
export async function loadDashboardKpisFromLocal(
  context: DashboardLoadContext,
): Promise<AnalyticsDashboard> {
  const currentVersion = cacheVersion;

  if (cachedDashboard && loadingPromise) {
    return loadingPromise;
  }

  const computeDashboard = async (): Promise<AnalyticsDashboard> => {
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

    if (cacheVersion === currentVersion) {
      cachedDashboard = dashboard;
    }
    return dashboard;
  };

  if (!loadingPromise) {
    loadingPromise = computeDashboard();
  }

  const dashboard = await loadingPromise;
  loadingPromise = null;
  return dashboard;
}
