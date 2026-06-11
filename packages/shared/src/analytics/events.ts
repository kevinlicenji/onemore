/**
 * PostHog event catalog for MVP-1 (P7-06). No PII in property names or values.
 */
export const POSTHOG_EVENTS = {
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PROGRAM_TEMPLATE_SELECTED: 'program_template_selected',
  PROGRAM_CREATED: 'program_created',
  WORKOUT_STARTED: 'workout_started',
  SET_COMPLETED: 'set_completed',
  WORKOUT_COMPLETED: 'workout_completed',
  PR_ACHIEVED: 'pr_achieved',
  DATA_EXPORT_REQUESTED: 'data_export_requested',
  ACCOUNT_DELETION_REQUESTED: 'account_deletion_requested',
  PUSH_SUBSCRIBED: 'push_subscribed',
  SETTINGS_UPDATED: 'settings_updated',
} as const;

export type PostHogEventName = (typeof POSTHOG_EVENTS)[keyof typeof POSTHOG_EVENTS];
