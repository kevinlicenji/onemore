import { describe, expect, it } from 'vitest';

import {
  addWorkoutExerciseSchema,
  startWorkoutSessionSchema,
  substituteExerciseSchema,
  updateWorkoutSessionNotesSchema,
  upsertSetLogSchema,
} from './workout.js';

describe('workout schemas', () => {
  it('accepts programmed session start', () => {
    const result = startWorkoutSessionSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      sessionType: 'programmed',
      programAssignmentId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects set log without client timestamp', () => {
    const result = upsertSetLogSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      exerciseExecutionId: '550e8400-e29b-41d4-a716-446655440001',
      setNumber: 1,
      isCompleted: true,
    });
    expect(result.success).toBe(false);
  });

  it('defaults free workout exercise targets', () => {
    const result = addWorkoutExerciseSchema.parse({
      exerciseLibraryId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.targetSets).toBe(3);
    expect(result.targetReps).toBe(10);
  });

  it('accepts substitute exercise payload', () => {
    const result = substituteExerciseSchema.safeParse({
      exerciseLibraryId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('accepts nullable session notes', () => {
    const result = updateWorkoutSessionNotesSchema.safeParse({ privateNotes: null });
    expect(result.success).toBe(true);
  });
});
