import type { EquipmentType } from './equipment-types.js';
import type { ExerciseCategory } from './exercise-categories.js';

export type ExerciseEquipmentGroup =
  | 'machines'
  | 'bodyweight'
  | 'free_weights'
  | 'cables'
  | 'cardio';

/** Equipment slugs shown in the exercise library filter dropdown. */
export const FILTER_EQUIPMENT_TYPES: EquipmentType[] = [
  'barbell',
  'dumbbell',
  'machine',
  'smith_machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'resistance_band',
  'pull_up_bar',
  'ez_bar',
  'treadmill',
  'bike',
  'rower',
  'stair_climber',
];

/** Category slugs shown in the exercise library filter dropdown. */
export const FILTER_EXERCISE_CATEGORIES: ExerciseCategory[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
  'full_body',
];

const EQUIPMENT_GROUP_MAP: Record<ExerciseEquipmentGroup, EquipmentType[]> = {
  machines: ['machine', 'smith_machine'],
  bodyweight: ['bodyweight', 'pull_up_bar', 'dip_station'],
  free_weights: ['barbell', 'dumbbell', 'ez_bar', 'trap_bar', 'kettlebell'],
  cables: ['cable'],
  cardio: ['treadmill', 'bike', 'rower', 'stair_climber'],
};

/**
 * Resolve equipment slugs for a high-level equipment group filter.
 *
 * @param group - Equipment group key from query params.
 */
export function equipmentTypesForGroup(group: ExerciseEquipmentGroup): EquipmentType[] {
  return [...EQUIPMENT_GROUP_MAP[group]];
}
