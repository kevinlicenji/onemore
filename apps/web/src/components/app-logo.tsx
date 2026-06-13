import type { ReactElement } from 'react';

import { cn } from '@onemore/ui';

interface AppLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

/**
 * OneMore brand mark (kettlebell) with optional wordmark.
 */
export function AppLogo({
  className,
  size = 80,
  showWordmark = false,
}: AppLogoProps): ReactElement {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <img
        alt="OneMore"
        className="rounded-[22%] border border-gym-separator bg-white object-cover shadow-sm"
        height={size}
        src="/apple-touch-icon.png"
        width={size}
      />
      {showWordmark ? <span className="text-lg font-bold tracking-tight">OneMore</span> : null}
    </span>
  );
}
