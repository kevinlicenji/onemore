import { describe, expect, it } from 'vitest';

import {
  calculateSheetDragOffset,
  SHEET_DISMISS_THRESHOLD,
  shouldDismissSheet,
} from './sheet-swipe-dismiss';

describe('calculateSheetDragOffset', () => {
  it('returns zero for upward drag', () => {
    expect(calculateSheetDragOffset(-10)).toBe(0);
  });

  it('returns positive offset for downward drag', () => {
    expect(calculateSheetDragOffset(40)).toBe(40);
  });
});

describe('shouldDismissSheet', () => {
  it('returns false below threshold', () => {
    expect(shouldDismissSheet(SHEET_DISMISS_THRESHOLD - 1)).toBe(false);
  });

  it('returns true at threshold', () => {
    expect(shouldDismissSheet(SHEET_DISMISS_THRESHOLD)).toBe(true);
  });
});
