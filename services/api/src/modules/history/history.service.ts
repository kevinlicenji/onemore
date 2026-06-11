import type { HistoryListQuery, HistoryListResponse, HistorySessionSummary } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';

import { HttpError } from '../../lib/errors.js';
import { computeSessionVolumeKg } from '../progress/session-metrics.js';
import type { WorkoutsService } from '../workouts/workouts.service.js';

/**
 * Completed workout history listing and detail.
 */
export class HistoryService {
  /**
   * @param prisma - Database client.
   * @param workoutsService - Session detail loader.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly workoutsService: WorkoutsService,
  ) {}

  /**
   * Paginated list of completed sessions, newest first.
   *
   * @param userId - Authenticated user id.
   * @param query - Date filters and cursor pagination.
   */
  async listSessions(userId: string, query: HistoryListQuery): Promise<HistoryListResponse> {
    const completedAtFilter =
      query.from || query.to
        ? {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          }
        : undefined;

    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'completed',
        ...(completedAtFilter ? { completedAt: completedAtFilter } : {}),
      },
      orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      include: {
        workoutDay: true,
        exerciseExecutions: {
          include: { setLogs: true },
        },
      },
    });

    const hasMore = sessions.length > query.limit;
    const page = hasMore ? sessions.slice(0, query.limit) : sessions;

    return {
      items: page.map((session) => this.toSummary(session)),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  }

  /**
   * Load a completed session with full exercise and set detail.
   *
   * @param userId - Session owner id.
   * @param sessionId - Workout session id.
   */
  async getSessionDetail(userId: string, sessionId: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, userId },
      select: { status: true },
    });

    if (!session) {
      throw new HttpError(404, 'Workout session not found', 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'completed') {
      throw new HttpError(404, 'Session is not in history', 'SESSION_NOT_COMPLETED');
    }

    return this.workoutsService.getSession(userId, sessionId);
  }

  private toSummary(
    session: Awaited<ReturnType<PrismaClient['workoutSession']['findMany']>>[number] & {
      workoutDay: { label: string } | null;
      exerciseExecutions: Array<{
        setLogs: Array<{ isCompleted: boolean; isWarmup: boolean }>;
      }>;
    },
  ): HistorySessionSummary {
    const completedSets = session.exerciseExecutions.flatMap((execution) =>
      execution.setLogs.filter((set) => set.isCompleted && !set.isWarmup),
    );

    return {
      id: session.id,
      status: session.status,
      sessionType: session.sessionType,
      workoutDayLabel: session.workoutDay?.label ?? null,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      durationSeconds: session.durationSeconds,
      exerciseCount: session.exerciseExecutions.length,
      totalSets: completedSets.length,
      totalVolumeKg: computeSessionVolumeKg(session as never),
    };
  }
}
