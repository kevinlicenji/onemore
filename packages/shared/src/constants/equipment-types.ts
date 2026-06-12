/** Controlled equipment vocabulary for system exercise catalog entries. */
export const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'ez_bar',
  'trap_bar',
  'kettlebell',
  'machine',
  'smith_machine',
  'cable',
  'bodyweight',
  'pull_up_bar',
  'dip_station',
  'resistance_band',
  'bench',
  'medicine_ball',
  'trx',
  'treadmill',
  'bike',
  'rower',
  'stair_climber',
  'other',
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const EQUIPMENT_GROUPS = {
  free_weights: ['barbell', 'dumbbell', 'ez_bar', 'trap_bar', 'kettlebell'] as const,
  machines: ['machine', 'smith_machine', 'cable'] as const,
  bodyweight: ['bodyweight', 'pull_up_bar', 'dip_station'] as const,
  accessories: ['resistance_band', 'bench', 'medicine_ball', 'trx'] as const,
  cardio: ['treadmill', 'bike', 'rower', 'stair_climber'] as const,
} as const;

export function isEquipmentType(value: string): value is EquipmentType {
  return (EQUIPMENT_TYPES as readonly string[]).includes(value);
}

export function isMachineEquipment(equipment: string): boolean {
  return equipment === 'machine' || equipment === 'smith_machine';
}
