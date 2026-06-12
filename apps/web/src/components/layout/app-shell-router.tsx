'use client';

import { DesktopShell } from '@/components/layout/desktop/desktop-shell';
import { GymShell } from '@/components/layout/gym/gym-shell';
import { ViewportGate } from '@/components/layout/viewport-gate';

interface AppShellRouterProps {
  locale: string;
  children: React.ReactNode;
}

/**
 * Selects desktop or gym mobile shell based on viewport.
 */
export function AppShellRouter({ locale, children }: AppShellRouterProps): React.ReactElement {
  return (
    <ViewportGate
      desktop={<DesktopShell locale={locale}>{children}</DesktopShell>}
      mobile={<GymShell locale={locale}>{children}</GymShell>}
    />
  );
}
