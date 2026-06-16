import type { DifficultyLevel, MuscleGroup } from '@onemore/shared';
import { defaultWorkoutDayLabel } from '@onemore/shared';

export interface BuilderExercise {
  exerciseLibraryId: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  targetWeightKg: number | null;
  weightPrescriptionMode: 'absolute' | 'percent_of_max';
  targetPercentOfMax: number | null;
}

export interface BuilderDay {
  label: string;
  exercises: BuilderExercise[];
  difficultyLevel: DifficultyLevel;
  difficultyManual: boolean;
}

export function emptyBuilderDay(index: number, locale: string): BuilderDay {
  return {
    label: defaultWorkoutDayLabel(index, locale),
    exercises: [],
    difficultyLevel: 2,
    difficultyManual: false,
  };
}
