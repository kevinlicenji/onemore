import { describe, expect, it } from 'vitest';

import { computeDashboardKpis, computeStreakWeeks, resolveWeeklyTarget } from './dashboard-kpis.js';
import { getCurrentIsoWeekKey, getIsoWeeksInYear } from './iso-week.js';
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

function createSessionsInCurrentWeek(count: number, timezone = 'UTC'): Array<{
  id: string;
  completedAt: string;
  sessionType: 'free' | 'programmed';
  workoutDayId: string | null;
  workoutDayLabel: string | null;
  totalSets: number;
  totalVolumeKg: number;
}> {
  const weekKey = getCurrentIsoWeekKey(timezone);
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() + (week - 1) * 7 - (jan4Day - 1));

  const sessions = [];
  for (let i = 0; i < count; i++) {
    const day = new Date(weekStart);
    day.setUTCDate(weekStart.getUTCDate() + i);
    day.setUTCHours(12, 0, 0, 0);
    sessions.push({
      id: `session-${String(i)}`,
      completedAt: day.toISOString(),
      sessionType: 'free' as const,
      workoutDayId: null,
      workoutDayLabel: null,
      totalSets: 5,
      totalVolumeKg: 500,
    });
  }
  return sessions;
}

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
    const sessions = createSessionsInCurrentWeek(5, 'UTC');

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
