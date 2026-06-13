import { describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from './analytics.service.js';
import { PrDetectionService } from '../progress/pr-detection.service.js';

describe('AnalyticsService', () => {
  it('returns zero streak when no completed sessions exist', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn(() => Promise.resolve({ timezone: 'Europe/Rome' })),
      },
      workoutSession: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
      personalRecord: {
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
        }),
      ),
    };

    const service = new AnalyticsService(
      prisma as never,
      workoutsService as never,
      new PrDetectionService(),
    );

    const dashboard = await service.getDashboard('user-1');

    expect(dashboard.streakWeeks).toBe(0);
    expect(dashboard.workoutsThisWeek).toBe(0);
    expect(dashboard.weeklySetsCompleted).toBe(0);
    expect(dashboard.lastWorkout).toBeNull();
  });
});
