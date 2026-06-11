import type {
  AddWorkoutExerciseInput,
  CreateCustomExercise,
  CreateProgramInput,
  ExerciseListItem,
  NextWorkoutPreview,
  OnboardingComplete,
  OnboardingUpdate,
  ProgramDetail,
  ProgramSummary,
  StartWorkoutSessionInput,
  TemplateSummary,
  UpsertSetLogInput,
  UserProfile,
  WorkoutSessionDetail,
} from '@onemore/shared';

import { API_BASE_URL } from '@/lib/api-config';

interface ApiErrorBody {
  error?: { message?: string; code?: string };
}

async function parseApiError(response: Response, fallback: string): Promise<Error> {
  const err = (await response.json()) as ApiErrorBody;
  return new Error(err.error?.message ?? fallback);
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
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

export async function searchExercises(
  accessToken: string,
  query: string,
): Promise<ExerciseListItem[]> {
  const params = new URLSearchParams({ q: query, limit: '20' });
  const response = await fetch(`${API_BASE_URL}/api/v1/exercises?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to search exercises');
  }
  const data = (await response.json()) as { exercises: ExerciseListItem[] };
  return data.exercises;
}

export async function createCustomExercise(
  accessToken: string,
  payload: CreateCustomExercise,
): Promise<ExerciseListItem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/exercises`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to create exercise');
  }
  return response.json() as Promise<ExerciseListItem>;
}

export async function fetchProgramTemplates(accessToken: string): Promise<TemplateSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/templates`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load templates');
  }
  const data = (await response.json()) as { templates: TemplateSummary[] };
  return data.templates;
}

export async function applyProgramTemplate(
  accessToken: string,
  slug: string,
): Promise<ProgramDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/templates/${slug}/apply`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to apply template');
  }
  return response.json() as Promise<ProgramDetail>;
}

export async function createProgram(
  accessToken: string,
  payload: CreateProgramInput,
): Promise<ProgramDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to create program');
  }
  return response.json() as Promise<ProgramDetail>;
}

export async function publishProgram(
  accessToken: string,
  programId: string,
): Promise<ProgramDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/${programId}/publish`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to publish program');
  }
  return response.json() as Promise<ProgramDetail>;
}

export async function fetchPrograms(accessToken: string): Promise<ProgramSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load programs');
  }
  const data = (await response.json()) as { programs: ProgramSummary[] };
  return data.programs;
}

export async function fetchNextWorkoutPreview(accessToken: string): Promise<NextWorkoutPreview> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/next`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load next workout');
  }
  return response.json() as Promise<NextWorkoutPreview>;
}

export async function fetchActiveWorkoutSession(
  accessToken: string,
): Promise<WorkoutSessionDetail | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/active`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load active session');
  }
  const data = (await response.json()) as { session: WorkoutSessionDetail | null };
  return data.session;
}

export async function startWorkoutSession(
  accessToken: string,
  payload: StartWorkoutSessionInput,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to start workout');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function fetchWorkoutSession(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load workout session');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function upsertWorkoutSet(
  accessToken: string,
  sessionId: string,
  payload: UpsertSetLogInput,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/sets`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to log set');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function addWorkoutExercise(
  accessToken: string,
  sessionId: string,
  payload: AddWorkoutExerciseInput,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/exercises`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to add exercise');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function completeWorkoutSession(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to complete workout');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function abandonWorkoutSession(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/abandon`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to abandon workout');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}
