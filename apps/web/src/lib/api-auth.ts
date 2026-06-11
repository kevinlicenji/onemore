import type { OnboardingComplete, OnboardingUpdate, UserProfile } from '@onemore/shared';

import { API_BASE_URL } from '@/lib/api-config';

interface ApiErrorBody {
  error?: { message?: string; code?: string };
}

async function parseApiError(response: Response, fallback: string): Promise<Error> {
  const err = (await response.json()) as ApiErrorBody;
  return new Error(err.error?.message ?? fallback);
}

/**
 * Fetch the authenticated user's full profile.
 *
 * @param accessToken - In-memory JWT access token.
 * @returns User profile from GET /users/me.
 */
export async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load profile');
  }
  return response.json() as Promise<UserProfile>;
}

/**
 * Save partial onboarding wizard progress.
 *
 * @param accessToken - In-memory JWT access token.
 * @param payload - One or more onboarding fields.
 */
export async function patchOnboarding(
  accessToken: string,
  payload: OnboardingUpdate,
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/onboarding`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to save onboarding progress');
  }
  return response.json() as Promise<UserProfile>;
}

/**
 * Mark onboarding complete with the full payload.
 *
 * @param accessToken - In-memory JWT access token.
 * @param payload - All required onboarding fields.
 */
export async function completeOnboarding(
  accessToken: string,
  payload: OnboardingComplete,
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to complete onboarding');
  }
  return response.json() as Promise<UserProfile>;
}

/**
 * Resolve post-auth destination based on onboarding status.
 *
 * @param locale - Active locale segment.
 * @param profile - User profile or null when unknown.
 * @returns Localized path for dashboard or onboarding.
 */
export function resolveAuthenticatedHomePath(locale: string, profile: UserProfile | null): string {
  if (profile?.onboardingCompletedAt) {
    return `/${locale}/dashboard`;
  }
  return `/${locale}/onboarding`;
}
