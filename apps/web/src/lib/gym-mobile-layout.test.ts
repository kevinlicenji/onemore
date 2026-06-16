import { describe, expect, it } from 'vitest';

import {
  gymMobileHorizontalPadding,
  gymMobilePageContentClassName,
  gymMobileShellBottomPadding,
  gymMobileShellBottomPaddingWithResume,
  gymMobileStackedActionsClassName,
} from './gym-mobile-layout';

describe('gym-mobile-layout', () => {
  it('uses safe-area aware horizontal padding', () => {
    expect(gymMobileHorizontalPadding).toContain('safe-area-inset-left');
    expect(gymMobileHorizontalPadding).toContain('safe-area-inset-right');
  });

  it('exposes full-width stacked action styles', () => {
    expect(gymMobileStackedActionsClassName).toContain('w-full');
    expect(gymMobilePageContentClassName).toContain('min-w-0');
  });

  it('accounts for FAB overhang in shell padding', () => {
    expect(gymMobileShellBottomPadding).toContain('0.75rem');
    expect(gymMobileShellBottomPaddingWithResume).toContain('3.25rem');
  });
});
