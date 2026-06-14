import { describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from './analytics.service.js';
import { PrDetectionService } from '../progress/pr-detection.service.js';

describe('AnalyticsService', () => {
  it('returns zero streak when no completed sessions exist', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(() =>
          Promise.resolve({ timezone: 'Europe/Rome', trainingDaysPerWeek: 3 }),
        ),
      },
      workoutSession: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
    };

    const workoutsService = {
      getNextWorkoutPreview: vi.fn(() =>
        Promise.resolve({
          hasActiveAssignment: false,
          programAssignmentId: null,
          workoutDayId: null,
          workoutDayLabel: null,
          exerciseCount: 0,
          programName: null,
          exercises: [],
          days: [],
        }),
      ),
    };

    const prDetection = new PrDetectionService();
    vi.spyOn(prDetection, 'listForUser').mockResolvedValue([]);

    const service = new AnalyticsService(prisma as never, workoutsService as never, prDetection);

    const dashboard = await service.getDashboard('user-1');

    expect(dashboard.streakWeeks).toBe(0);
    expect(dashboard.workoutsThisWeek).toBe(0);
    expect(dashboard.weeklySetsCompleted).toBe(0);
    expect(dashboard.lastWorkout).toBeNull();
    expect(dashboard.weeklyConsistency.workoutsCompleted).toBe(0);
    expect(dashboard.weeklyConsistency.weeklyTarget).toBe(3);
    expect(dashboard.volumeComparison.thisWeekKg).toBe(0);
    expect(dashboard.monthlyStats.personalRecordsCount).toBe(0);
  });
});
