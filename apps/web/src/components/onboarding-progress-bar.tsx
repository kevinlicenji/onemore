'use client';

import type { ReactElement } from 'react';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Smooth animated progress indicator for the onboarding wizard.
 */
export function OnboardingProgressBar({
  currentStep,
  totalSteps,
}: OnboardingProgressBarProps): ReactElement {
  const progressPercent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div
      aria-hidden
      className="h-2 w-full overflow-hidden rounded-full bg-muted/80 shadow-inner"
      role="presentation"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ width: `${String(progressPercent)}%` }}
      />
    </div>
  );
}
