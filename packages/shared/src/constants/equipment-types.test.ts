import { describe, expect, it } from 'vitest';

import { isEquipmentType, isMachineEquipment } from './equipment-types.js';

describe('equipment-types', () => {
  it('recognises valid equipment slugs', () => {
    expect(isEquipmentType('machine')).toBe(true);
    expect(isEquipmentType('smith_machine')).toBe(true);
    expect(isEquipmentType('unknown-gear')).toBe(false);
  });

  it('detects machine equipment groups', () => {
    expect(isMachineEquipment('machine')).toBe(true);
    expect(isMachineEquipment('smith_machine')).toBe(true);
    expect(isMachineEquipment('dumbbell')).toBe(false);
  });
});
