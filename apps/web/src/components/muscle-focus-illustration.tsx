'use client';

import type { OnboardingMuscleFocusId } from '@onemore/shared';
import type { ReactElement } from 'react';

interface MuscleFocusIllustrationProps {
  focusId: OnboardingMuscleFocusId;
  className?: string;
}

const HIGHLIGHT = 'var(--primary)';
const BODY = 'currentColor';

/**
 * Simple body silhouette with a highlighted muscle region for onboarding cards.
 */
export function MuscleFocusIllustration({
  focusId,
  className,
}: MuscleFocusIllustrationProps): ReactElement {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 64 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke={BODY} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <circle cx="32" cy="10" r="7" />
        <path d="M32 17v10M20 30h24M18 30v8c0 6 4 10 14 10s14-4 14-10v-8" />
        <path d="M18 38v22M46 38v22M24 60v24M40 60v24" />
      </g>
      <HighlightRegion focusId={focusId} />
    </svg>
  );
}

function HighlightRegion({ focusId }: { focusId: OnboardingMuscleFocusId }): ReactElement | null {
  switch (focusId) {
    case 'chest':
      return <ellipse cx="32" cy="34" fill={HIGHLIGHT} opacity="0.85" rx="11" ry="7" />;
    case 'back':
      return <ellipse cx="32" cy="36" fill={HIGHLIGHT} opacity="0.85" rx="10" ry="12" />;
    case 'shoulders':
      return (
        <>
          <circle cx="21" cy="30" fill={HIGHLIGHT} opacity="0.85" r="5" />
          <circle cx="43" cy="30" fill={HIGHLIGHT} opacity="0.85" r="5" />
        </>
      );
    case 'arms':
      return (
        <>
          <rect fill={HIGHLIGHT} height="18" opacity="0.85" rx="3" width="6" x="14" y="38" />
          <rect fill={HIGHLIGHT} height="18" opacity="0.85" rx="3" width="6" x="44" y="38" />
        </>
      );
    case 'legs':
      return (
        <>
          <rect fill={HIGHLIGHT} height="22" opacity="0.85" rx="4" width="8" x="22" y="60" />
          <rect fill={HIGHLIGHT} height="22" opacity="0.85" rx="4" width="8" x="34" y="60" />
        </>
      );
    case 'glutes':
      return <ellipse cx="32" cy="56" fill={HIGHLIGHT} opacity="0.85" rx="10" ry="6" />;
    case 'core':
      return <ellipse cx="32" cy="46" fill={HIGHLIGHT} opacity="0.85" rx="8" ry="9" />;
    case 'balanced':
      return (
        <rect
          fill={HIGHLIGHT}
          height="58"
          opacity="0.35"
          rx="12"
          stroke={HIGHLIGHT}
          strokeWidth="1.5"
          width="28"
          x="18"
          y="20"
        />
      );
    default:
      return null;
  }
}
