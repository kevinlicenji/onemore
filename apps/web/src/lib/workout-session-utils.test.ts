import { describe, expect, it } from 'vitest';

import type { WorkoutSessionDetail } from '@onemore/shared';

import { hasCompletedWorkingSet } from './workout-session-utils';

function makeSession(
  sets: Array<{ isCompleted: boolean; isWarmup?: boolean }>,
): WorkoutSessionDetail {
  return {
    id: 'session',
    status: 'in_progress',
    sessionType: 'free',
    programAssignmentId: null,
    workoutDayId: null,
    workoutDayLabel: null,
    workoutDayDifficultyLevel: null,
    startedAt: '2026-06-12T10:00:00.000Z',
    completedAt: null,
    durationSeconds: null,
    privateNotes: null,
    exercises: [
      {
        id: 'ex-1',
        exerciseLibraryId: 'lib-1',
        sortOrder: 0,
        status: 'in_progress',
        athleteNotes: null,
        substitutedFromExerciseId: null,
        prescription: {
          targetSets: 3,
          targetReps: 8,
          targetWeightKg: 60,
          restSeconds: 90,
          coachNote: null,
        },
        exercise: {
          id: 'lib-1',
          slug: 'squat',
          names: { en: 'Squat' },
          isBodyweight: false,
        },
        previousSet: null,
        sets: sets.map((set, index) => ({
          id: `set-${String(index + 1)}`,
          setNumber: index + 1,
          weightKg: null,
          reps: null,
          rpe: null,
          rir: null,
          isWarmup: set.isWarmup ?? false,
          isCompleted: set.isCompleted,
          isSkipped: false,
          isFailed: false,
          clientTimestamp: '2026-06-12T10:00:00.000Z',
        })),
      },
    ],
  };
}

describe('hasCompletedWorkingSet', () => {
  it('returns false when no working set is completed', () => {
    expect(hasCompletedWorkingSet(makeSession([{ isCompleted: false }]))).toBe(false);
  });

  it('returns false when only warmup sets are completed', () => {
    expect(hasCompletedWorkingSet(makeSession([{ isCompleted: true, isWarmup: true }]))).toBe(
      false,
    );
  });

  it('returns true when at least one working set is completed', () => {
    expect(hasCompletedWorkingSet(makeSession([{ isCompleted: true }]))).toBe(true);
  });
});
