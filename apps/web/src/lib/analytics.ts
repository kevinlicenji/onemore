import type { PostHog } from 'posthog-js';

type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

let posthogClient: PostHog | null = null;

/**
 * Register the PostHog client instance from the provider.
 *
 * @param client - Initialized PostHog client or null when disabled.
 */
export function setPostHogClient(client: PostHog | null): void {
  posthogClient = client;
}

/**
 * Identify the authenticated user for analytics (id only — no PII).
 *
 * @param userId - Stable user uuid.
 */
export function identifyUser(userId: string): void {
  if (!posthogClient) {
    return;
  }
  posthogClient.identify(userId);
}

/**
 * Track a product analytics event when PostHog is configured.
 *
 * @param event - Event name from the analytics catalog.
 * @param properties - Non-PII event properties.
 */
export function trackEvent(event: string, properties?: AnalyticsProperties): void {
  if (!posthogClient) {
    return;
  }
  posthogClient.capture(event, properties);
}

/**
 * Track onboarding step completion for funnel analytics.
 *
 * @param stepId - Stable step identifier.
 * @param stepIndex - Zero-based step index.
 */
export function trackOnboardingStepCompleted(stepId: string, stepIndex: number): void {
  trackEvent('onboarding_step_completed', { step_id: stepId, step_index: stepIndex });
}

/**
 * Track onboarding completion with training preferences.
 *
 * @param motivationLevel - Selected motivation level (1–3).
 * @param goal - Training goal enum value.
 * @param level - Training level enum value.
 */
export function trackOnboardingCompleted(
  motivationLevel: number,
  goal: string,
  level: string,
): void {
  trackEvent('onboarding_completed', {
    motivation_level: motivationLevel,
    goal,
    level,
  });
}
