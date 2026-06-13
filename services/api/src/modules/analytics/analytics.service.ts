import type { AnalyticsDashboard } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import { getCurrentIsoWeekKey, getIsoWeekKey } from '../progress/iso-week.js';
import type { PrDetectionService } from '../progress/pr-detection.service.js';
import {
  computeSessionVolumeKg,
} from '../progress/session-metrics.js';
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
      select: { timezone: true },
    });
    const timezone = user?.timezone ?? 'Europe/Rome';

    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      include: {
        workoutDay: true,
        exerciseExecutions: {
          include: { setLogs: true },
        },
      },
    });

    const completedSessions = sessions.filter(
      (session) => session.status === 'completed' && session.completedAt,
    );

    const currentWeekKey = getCurrentIsoWeekKey(timezone);
    const sessionsThisWeek = completedSessions.filter(
      (session) =>
        session.completedAt && getIsoWeekKey(session.completedAt, timezone) === currentWeekKey,
    );

    const workoutsThisWeek = sessionsThisWeek.length;

    const weeklySetsCompleted = sessionsThisWeek.reduce((sum, session) => {
      const sets = session.exerciseExecutions.flatMap((execution) =>
        execution.setLogs.filter((set) => set.isCompleted && !set.isWarmup),
      );
      return sum + sets.length;
    }, 0);

    const weeklyVolumeKg = sessionsThisWeek.reduce(
      (sum, session) => sum + computeSessionVolumeKg(session),
      0,
    );

    const last = completedSessions[0];
    const nextWorkout = await this.workoutsService.getNextWorkoutPreview(userId);
    const recentPersonalRecords = await this.prDetection.listRecent(this.prisma, userId, 5);

    return {
      streakWeeks: this.computeStreakWeeks(completedSessions, timezone),
      workoutsThisWeek,
      weeklySetsCompleted,
      weeklyVolumeKg: Math.round(weeklyVolumeKg * 100) / 100,
      lastWorkout: last?.completedAt
        ? {
            id: last.id,
            label: last.workoutDay?.label ?? null,
            completedAt: last.completedAt.toISOString(),
            durationSeconds: last.durationSeconds,
          }
        : null,
      nextWorkout,
      recentPersonalRecords,
    };
  }

  private computeStreakWeeks(
    sessions: Array<{ completedAt: Date | null }>,
    timezone: string,
  ): number {
    const weekKeys = new Set<string>();
    for (const session of sessions) {
      if (session.completedAt) {
        weekKeys.add(getIsoWeekKey(session.completedAt, timezone));
      }
    }

    if (weekKeys.size === 0) {
      return 0;
    }

    let streak = 0;
    let cursor = getCurrentIsoWeekKey(timezone);

    while (weekKeys.has(cursor)) {
      streak += 1;
      cursor = this.previousIsoWeekKey(cursor);
    }

    return streak;
  }

  private previousIsoWeekKey(weekKey: string): string {
    const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
    if (!match) {
      return weekKey;
    }

    const year = Number(match[1]);
    const week = Number(match[2]);
    if (week > 1) {
      return `${String(year)}-W${String(week - 1).padStart(2, '0')}`;
    }

    const prevYearLastWeek = this.isoWeeksInYear(year - 1);
    return `${String(year - 1)}-W${String(prevYearLastWeek).padStart(2, '0')}`;
  }

  private isoWeeksInYear(year: number): number {
    const dec28 = new Date(Date.UTC(year, 11, 28));
    const day = dec28.getUTCDay() || 7;
    dec28.setUTCDate(dec28.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dec28.getUTCFullYear(), 0, 1));
    return Math.ceil(((dec28.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  }
}
