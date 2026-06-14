import type { AnalyticsDashboard } from '@onemore/shared';
import {
  computeDashboardKpis,
  type DashboardSessionInput,
} from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import type { PrDetectionService } from '../progress/pr-detection.service.js';
import { computeSessionVolumeKg } from '../progress/session-metrics.js';
import type { WorkoutsService } from '../workouts/workouts.service.js';

/**
 * Dashboard analytics: streak, weekly volume, frequency, and recent PRs.
 */
export class AnalyticsService {
  /**
   * @param prisma - Database client.
   * @param workoutsService - Next workout preview provider.
   * @param prDetection - Recent PR listing.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly workoutsService: WorkoutsService,
    private readonly prDetection: PrDetectionService,
  ) {}

  /**
   * Aggregate dashboard metrics for the authenticated user.
   *
   * @param userId - Authenticated user id.
   */
  async getDashboard(userId: string): Promise<AnalyticsDashboard> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, trainingDaysPerWeek: true },
    });
    const timezone = user?.timezone ?? 'Europe/Rome';

    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, status: 'completed', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      include: {
        workoutDay: true,
        exerciseExecutions: {
          include: { setLogs: true },
        },
      },
    });

    const sessionInputs: DashboardSessionInput[] = sessions
      .filter((session) => session.completedAt)
      .map((session) => {
        const completedSets = session.exerciseExecutions.flatMap((execution) =>
          execution.setLogs.filter((set) => set.isCompleted && !set.isWarmup),
        );
        return {
          id: session.id,
          completedAt: session.completedAt!.toISOString(),
          sessionType: session.sessionType,
          workoutDayId: session.workoutDayId,
          workoutDayLabel: session.workoutDay?.label ?? null,
          totalSets: completedSets.length,
          totalVolumeKg: computeSessionVolumeKg(session),
        };
      });

    const [nextWorkout, personalRecords] = await Promise.all([
      this.workoutsService.getNextWorkoutPreview(userId),
      this.prDetection.listForUser(this.prisma, userId, 200),
    ]);

    const dashboard = computeDashboardKpis({
      timezone,
      locale: 'en',
      trainingDaysPerWeek: user?.trainingDaysPerWeek ?? null,
      nextWorkout,
      sessions: sessionInputs,
      personalRecords,
    });

    const lastSession = sessions[0];
    if (lastSession?.completedAt) {
      dashboard.lastWorkout = {
        id: lastSession.id,
        label: lastSession.workoutDay?.label ?? null,
        completedAt: lastSession.completedAt.toISOString(),
        durationSeconds: lastSession.durationSeconds,
      };
    }

    return dashboard;
  }

  /**
   * List personal records for offline dashboard hydration.
   *
   * @param userId - Authenticated user id.
   * @param limit - Max records to return.
   */
  async listPersonalRecords(userId: string, limit = 200) {
    return this.prDetection.listForUser(this.prisma, userId, limit);
  }
}
