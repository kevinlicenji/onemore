import type { WorkoutExerciseDetail } from './workout-exercise-set-state';
import { describe, expect, it } from 'vitest';

import { buildExerciseSetViewState } from './workout-exercise-set-state';

function makeExercise(overrides: Partial<WorkoutExerciseDetail> = {}): WorkoutExerciseDetail {
  return {
    id: 'ex-1',
    exerciseLibraryId: 'lib-1',
    sortOrder: 0,
    status: 'in_progress',
    substitutedFromExerciseId: null,
    athleteNotes: null,
    exercise: {
      id: 'lib-1',
      names: { en: 'Bench Press', it: 'Panca piana' },
      slug: 'bench-press',
    },
    prescription: {
      targetSets: 3,
      targetReps: 10,
      targetWeightKg: 60,
      restSeconds: 90,
      coachNote: null,
    },
    previousSet: { weightKg: 55, reps: 10 },
    sets: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        setNumber: 1,
        reps: 10,
        weightKg: 60,
        isCompleted: true,
        isSkipped: false,
        isFailed: false,
        isWarmup: false,
        clientTimestamp: '2026-06-12T10:00:00.000Z',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        setNumber: 2,
        reps: null,
        weightKg: null,
        isCompleted: false,
        isSkipped: false,
        isFailed: false,
        isWarmup: false,
        clientTimestamp: '2026-06-12T10:01:00.000Z',
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        setNumber: 3,
        reps: null,
        weightKg: null,
        isCompleted: false,
        isSkipped: false,
        isFailed: false,
        isWarmup: false,
        clientTimestamp: '2026-06-12T10:02:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('buildExerciseSetViewState', () => {
  it('selects the first incomplete set as active', () => {
    const state = buildExerciseSetViewState({
      exercise: makeExercise(),
      restTimerContext: null,
      actualRestBySetId: {},
      labels: { placeholderReps: 'Reps', placeholderWeight: 'Kg', failureReps: 'Cedimento' },
    });

    expect(state.activeSet?.id).toBe('00000000-0000-4000-8000-000000000002');
    expect(state.completedSets).toHaveLength(1);
    expect(state.futureSets).toHaveLength(1);
    expect(state.getRepsPlaceholder(false)).toBe('10');
    expect(state.getWeightPlaceholder(false)).toBe('55');
  });

  it('hides active set while resting', () => {
    const state = buildExerciseSetViewState({
      exercise: makeExercise(),
      restTimerContext: {
        setId: '00000000-0000-4000-8000-000000000001',
        seconds: 90,
      },
      actualRestBySetId: {},
      labels: { placeholderReps: 'Reps', placeholderWeight: 'Kg', failureReps: 'Cedimento' },
    });

    expect(state.activeSet).toBeNull();
    expect(state.isResting).toBe(true);
    expect(state.futureSets).toHaveLength(2);
  });

  it('uses actual rest when available', () => {
    const state = buildExerciseSetViewState({
      exercise: makeExercise(),
      restTimerContext: null,
      actualRestBySetId: { '00000000-0000-4000-8000-000000000001': 72 },
      labels: { placeholderReps: 'Reps', placeholderWeight: 'Kg', failureReps: 'Cedimento' },
    });

    expect(state.getDisplayedRestSeconds('00000000-0000-4000-8000-000000000001')).toBe(72);
    expect(state.getDisplayedRestSeconds('00000000-0000-4000-8000-000000000002')).toBe(90);
  });
});
