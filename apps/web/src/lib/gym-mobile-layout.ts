/**
 * Shared responsive spacing for mobile gym screens.
 * Uses safe-area insets and fluid widths — no fixed pixel gutters.
 */
export const gymMobileHorizontalPadding =
  'px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]';

export const gymMobilePageContentClassName = `flex w-full min-w-0 flex-col gap-5 pb-6 pt-4 ${gymMobileHorizontalPadding}`;

/** Bottom padding accounting for tab bar and center FAB overhang. */
export const gymMobileShellBottomPadding =
  'pb-[calc(var(--tab-bar-height)+0.75rem+env(safe-area-inset-bottom))]';

/** Extra bottom padding when the active-workout resume strip is visible. */
export const gymMobileShellBottomPaddingWithResume =
  'pb-[calc(var(--tab-bar-height)+3.25rem+0.75rem+env(safe-area-inset-bottom))]';

export const gymMobileStackedActionsClassName =
  'flex w-full flex-col gap-2 [&_a]:flex [&_a]:min-h-11 [&_a]:w-full [&_a]:items-center [&_a]:justify-center [&_button]:min-h-11 [&_button]:w-full';
