import { describe, expect, it } from 'vitest';

import { computeDashboardKpis, computeStreakWeeks, resolveWeeklyTarget } from './dashboard-kpis.js';
import type { NextWorkoutPreview } from '../schemas/workout.js';

const emptyNextWorkout: NextWorkoutPreview = {
  hasActiveAssignment: false,
  programAssignmentId: null,
  workoutDayId: null,
  workoutDayLabel: null,
  exerciseCount: 0,
  programName: null,
  exercises: [],
  days: [],
};

describe('resolveWeeklyTarget', () => {
  it('uses program day count when an assignment is active', () => {
    const result = resolveWeeklyTarget(
      {
        ...emptyNextWorkout,
        hasActiveAssignment: true,
        days: [
          {
            workoutDayId: 'a',
            label: 'A',
            difficultyLevel: 1,
            exerciseCount: 1,
            muscleGroups: [],
            exercises: [],
          },
          {
            workoutDayId: 'b',
            label: 'B',
            difficultyLevel: 1,
            exerciseCount: 1,
            muscleGroups: [],
            exercises: [],
          },
          {
            workoutDayId: 'c',
            label: 'C',
            difficultyLevel: 1,
            exerciseCount: 1,
            muscleGroups: [],
            exercises: [],
          },
          {
            workoutDayId: 'd',
            label: 'D',
            difficultyLevel: 1,
            exerciseCount: 1,
            muscleGroups: [],
            exercises: [],
          },
        ],
      },
      3,
    );
    expect(result).toEqual({ weeklyTarget: 4, targetSource: 'program' });
  });

  it('falls back to onboarding days when no program is active', () => {
    expect(resolveWeeklyTarget(emptyNextWorkout, 5)).toEqual({
      weeklyTarget: 5,
      targetSource: 'onboarding',
    });
  });

  it('defaults to 3 when no program or onboarding value exists', () => {
    expect(resolveWeeklyTarget(emptyNextWorkout, null)).toEqual({
      weeklyTarget: 3,
      targetSource: 'default',
    });
  });
});

describe('computeStreakWeeks', () => {
  it('returns zero when no sessions exist', () => {
    expect(computeStreakWeeks([], 'Europe/Rome')).toBe(0);
  });
});

describe('computeDashboardKpis', () => {
  it('counts free workouts toward weekly consistency and target progress', () => {
    const now = new Date();
    const dashboard = computeDashboardKpis({
      timezone: 'UTC',
      locale: 'en',
      trainingDaysPerWeek: 4,
      nextWorkout: emptyNextWorkout,
      personalRecords: [],
      sessions: [
        {
          id: 'session-1',
          completedAt: now.toISOString(),
          sessionType: 'free',
          workoutDayId: null,
          workoutDayLabel: null,
          totalSets: 10,
          totalVolumeKg: 1000,
        },
      ],
    });

    expect(dashboard.weeklyConsistency.workoutsCompleted).toBe(1);
    expect(dashboard.workoutsThisWeek).toBe(1);
    expect(dashboard.weeklyConsistency.weekDays.some((day) => day.completed)).toBe(true);
  });

  it('allows workouts completed to exceed weekly target', () => {
    const now = new Date();
    const sessions = Array.from({ length: 5 }, (_, index) => ({
      id: `session-${String(index)}`,
      completedAt: new Date(now.getTime() - index * 86_400_000).toISOString(),
      sessionType: 'free' as const,
      workoutDayId: null,
      workoutDayLabel: null,
      totalSets: 5,
      totalVolumeKg: 500,
    }));

    const dashboard = computeDashboardKpis({
      timezone: 'UTC',
      locale: 'it',
      trainingDaysPerWeek: 4,
      nextWorkout: emptyNextWorkout,
      personalRecords: [],
      sessions,
    });

    expect(dashboard.weeklyConsistency.workoutsCompleted).toBe(5);
    expect(dashboard.weeklyConsistency.weeklyTarget).toBe(4);
  });
});
