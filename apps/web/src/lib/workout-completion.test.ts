import { describe, expect, it } from 'vitest';

import type { WorkoutExerciseDetail } from '@/lib/workout-exercise-set-state';

import {
  findNextActiveExerciseIndex,
  isExerciseFullyResolved,
  isWorkoutFullyResolved,
  isWorkoutReadyToAutoFinish,
  shouldAutoAdvanceFromExercise,
  shouldOfferAddSet,
} from './workout-completion';

function makeExercise(
  overrides: Partial<WorkoutExerciseDetail> & {
    sets: WorkoutExerciseDetail['sets'];
  },
): WorkoutExerciseDetail {
  return {
    id: 'ex-1',
    exerciseLibraryId: 'lib-1',
    status: 'in_progress',
    sortOrder: 0,
    substitutedFromExerciseId: null,
    athleteNotes: null,
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
    ...overrides,
    sets: overrides.sets,
  };
}

function makeSet(
  overrides: Partial<WorkoutExerciseDetail['sets'][number]> & {
    id: string;
    setNumber: number;
  },
): WorkoutExerciseDetail['sets'][number] {
  return {
    weightKg: null,
    reps: null,
    isWarmup: false,
    isCompleted: false,
    isSkipped: false,
    isFailed: false,
    clientTimestamp: '2026-06-12T10:00:00.000Z',
    ...overrides,
  };
}

describe('isExerciseFullyResolved', () => {
  it('returns false when a set is still pending', () => {
    const exercise = makeExercise({
      sets: [
        makeSet({ id: 's1', setNumber: 1, isCompleted: true, reps: 8, weightKg: 60 }),
        makeSet({ id: 's2', setNumber: 2, reps: 8, weightKg: 60 }),
      ],
    });
    expect(isExerciseFullyResolved(exercise)).toBe(false);
  });

  it('returns true when all sets are completed or skipped', () => {
    const exercise = makeExercise({
      sets: [
        makeSet({ id: 's1', setNumber: 1, isSkipped: true }),
        makeSet({ id: 's2', setNumber: 2, isCompleted: true, reps: 8, weightKg: 60 }),
      ],
    });
    expect(isExerciseFullyResolved(exercise)).toBe(true);
  });
});

describe('shouldOfferAddSet', () => {
  it('returns false when every set was skipped', () => {
    const exercise = makeExercise({
      sets: [
        makeSet({ id: 's1', setNumber: 1, isSkipped: true }),
        makeSet({ id: 's2', setNumber: 2, isSkipped: true }),
      ],
    });
    expect(shouldOfferAddSet(exercise)).toBe(false);
  });

  it('returns true when the last set was completed', () => {
    const exercise = makeExercise({
      sets: [
        makeSet({ id: 's1', setNumber: 1, isCompleted: true, reps: 8, weightKg: 60 }),
        makeSet({ id: 's2', setNumber: 2, isCompleted: true, reps: 8, weightKg: 60 }),
      ],
    });
    expect(shouldOfferAddSet(exercise)).toBe(true);
  });

  it('returns false when the last set was skipped', () => {
    const exercise = makeExercise({
      sets: [
        makeSet({ id: 's1', setNumber: 1, isCompleted: true, reps: 8, weightKg: 60 }),
        makeSet({ id: 's2', setNumber: 2, isCompleted: true, reps: 8, weightKg: 60 }),
        makeSet({ id: 's3', setNumber: 3, isSkipped: true }),
      ],
    });
    expect(shouldOfferAddSet(exercise)).toBe(false);
  });
});

describe('shouldAutoAdvanceFromExercise', () => {
  it('returns true when every set is completed or skipped', () => {
    const exercise = makeExercise({
      sets: [
        makeSet({ id: 's1', setNumber: 1, isCompleted: true, reps: 8, weightKg: 60 }),
        makeSet({ id: 's2', setNumber: 2, isSkipped: true }),
      ],
    });
    expect(shouldAutoAdvanceFromExercise(exercise)).toBe(true);
  });

  it('returns false while a set is still pending', () => {
    const exercise = makeExercise({
      sets: [
        makeSet({ id: 's1', setNumber: 1, isCompleted: true, reps: 8, weightKg: 60 }),
        makeSet({ id: 's2', setNumber: 2 }),
      ],
    });
    expect(shouldAutoAdvanceFromExercise(exercise)).toBe(false);
  });
});

describe('isWorkoutFullyResolved', () => {
  it('returns true when every exercise is completed or skipped', () => {
    expect(
      isWorkoutFullyResolved({
        id: 'session',
        exercises: [{ status: 'completed' }, { status: 'skipped' }],
      } as never),
    ).toBe(true);
  });

  it('returns false when an exercise is still in progress', () => {
    expect(
      isWorkoutFullyResolved({
        id: 'session',
        exercises: [{ status: 'completed' }, { status: 'in_progress' }],
      } as never),
    ).toBe(false);
  });
});

describe('findNextActiveExerciseIndex', () => {
  it('skips completed and skipped exercises', () => {
    const session = {
      exercises: [{ status: 'completed' }, { status: 'skipped' }, { status: 'pending' }],
    } as never;

    expect(findNextActiveExerciseIndex(session, 0)).toBe(2);
  });
});

describe('isWorkoutReadyToAutoFinish', () => {
  it('returns false while an exercise still invites an extra set', () => {
    const session = {
      exercises: [
        {
          status: 'completed',
          sets: [makeSet({ id: 's1', setNumber: 1, isCompleted: true, reps: 8, weightKg: 60 })],
        },
      ],
    } as never;

    expect(isWorkoutReadyToAutoFinish(session)).toBe(false);
  });

  it('returns true when every exercise is skipped', () => {
    const session = {
      exercises: [
        { status: 'skipped', sets: [] },
        { status: 'skipped', sets: [] },
      ],
    } as never;

    expect(isWorkoutReadyToAutoFinish(session)).toBe(true);
  });
});
