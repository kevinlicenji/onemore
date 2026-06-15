import type {
  AccountDeletionResponse,
  AddWorkoutExerciseInput,
  AddWorkoutSetInput,
  AnalyticsDashboard,
  ChangePasswordBody,
  CreateCustomExercise,
  CreateSupplementInput,
  CreateSupplementLogInput,
  CreateProgramInput,
  DataExportJob,
  ExerciseListItem,
  HistoryListQuery,
  HistoryListResponse,
  NextWorkoutPreview,
  OnboardingComplete,
  OnboardingUpdate,
  PersonalRecordSummary,
  ProgramDetail,
  ProgramSummary,
  RequestDataExportResponse,
  StartWorkoutSessionInput,
  SubstituteExerciseInput,
  SupplementDetail,
  SupplementListItem,
  SupplementLogItem,
  SupplementLogListResponse,
  SupplementTrendItem,
  TemplateSummary,
  TodaySupplementsResponse,
  UpdateWorkoutExerciseNotesInput,
  UpdateWorkoutSessionNotesInput,
  UpdateHistorySet,
  UpdateUserProfile,
  UpdateCustomExercise,
  UpdateSupplementInput,
  UpsertSetLogInput,
  UpsertSetResponse,
  UserProfile,
  WorkoutSessionDetail,
} from '@onemore/shared';
import { EXERCISE_CATALOG_LIMIT } from '@onemore/shared';

import { API_BASE_URL } from '@/lib/api-config';

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

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

export interface ExerciseQueryFilters {
  q?: string;
  category?: string;
  equipment?: string;
  isBodyweight?: boolean;
  equipmentGroup?: 'machines' | 'bodyweight' | 'free_weights' | 'cables' | 'cardio';
  muscle?: string;
  limit?: number;
}

export async function fetchExercises(
  accessToken: string,
  filters: ExerciseQueryFilters = {},
): Promise<ExerciseListItem[]> {
  const params = new URLSearchParams({
    limit: String(filters.limit ?? EXERCISE_CATALOG_LIMIT),
  });
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.category) {
    params.set('category', filters.category);
  }
  if (filters.equipment) {
    params.set('equipment', filters.equipment);
  }
  if (filters.isBodyweight !== undefined) {
    params.set('isBodyweight', filters.isBodyweight ? 'true' : 'false');
  }
  if (filters.equipmentGroup) {
    params.set('equipmentGroup', filters.equipmentGroup);
  }
  if (filters.muscle) {
    params.set('muscle', filters.muscle);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/exercises?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load exercises');
  }
  const data = (await response.json()) as { exercises: ExerciseListItem[] };
  return data.exercises;
}

export async function searchExercises(
  accessToken: string,
  query: string,
  filters: Omit<ExerciseQueryFilters, 'q'> = {},
): Promise<ExerciseListItem[]> {
  const trimmed = query.trim();
  const limit = filters.limit ?? EXERCISE_CATALOG_LIMIT;
  if (trimmed.length >= 1) {
    return fetchExercises(accessToken, { ...filters, q: trimmed, limit });
  }
  return fetchExercises(accessToken, { ...filters, limit });
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

export async function updateCustomExercise(
  accessToken: string,
  exerciseId: string,
  payload: UpdateCustomExercise,
): Promise<ExerciseListItem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/exercises/${exerciseId}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update exercise');
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

export async function fetchProgramTemplateDetail(
  accessToken: string,
  slug: string,
): Promise<ProgramDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/templates/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load template');
  }
  return response.json() as Promise<ProgramDetail>;
}

export async function fetchProgramDetail(
  accessToken: string,
  programId: string,
): Promise<ProgramDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/${programId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load program');
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

export async function updateProgram(
  accessToken: string,
  programId: string,
  payload: CreateProgramInput,
): Promise<ProgramDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/${programId}`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update program');
  }
  return response.json() as Promise<ProgramDetail>;
}

export async function deleteProgram(accessToken: string, programId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/${programId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete program');
  }
}

export async function activateProgram(
  accessToken: string,
  programId: string,
): Promise<ProgramDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/programs/${programId}/activate`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to activate program');
  }
  return response.json() as Promise<ProgramDetail>;
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
): Promise<UpsertSetResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/sets`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to log set');
  }
  return response.json() as Promise<UpsertSetResponse>;
}

export async function fetchHistorySessions(
  accessToken: string,
  query: HistoryListQuery = { limit: 20 },
): Promise<HistoryListResponse> {
  const params = new URLSearchParams();
  if (query.from) {
    params.set('from', query.from);
  }
  if (query.to) {
    params.set('to', query.to);
  }
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.limit) {
    params.set('limit', String(query.limit));
  }
  const qs = params.toString();
  const url = qs
    ? `${API_BASE_URL}/api/v1/history/sessions?${qs}`
    : `${API_BASE_URL}/api/v1/history/sessions`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load history');
  }
  return response.json() as Promise<HistoryListResponse>;
}

export async function fetchHistorySessionDetail(
  accessToken: string,
  sessionId: string,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load session');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function deleteHistorySession(accessToken: string, sessionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete session');
  }
}

export async function updateHistorySet(
  accessToken: string,
  sessionId: string,
  setId: string,
  payload: UpdateHistorySet,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/history/sessions/${sessionId}/sets/${setId}`,
    {
      method: 'PATCH',
      headers: authHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update set');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function patchUserProfile(
  accessToken: string,
  payload: UpdateUserProfile,
): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update profile');
  }
  return response.json() as Promise<UserProfile>;
}

export async function changeUserPassword(
  accessToken: string,
  payload: ChangePasswordBody,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/password`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to change password');
  }
}

export async function logoutSession(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function requestDataExport(accessToken: string): Promise<RequestDataExportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/export`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to request export');
  }
  return response.json() as Promise<RequestDataExportResponse>;
}

export async function fetchLatestExportJob(accessToken: string): Promise<DataExportJob | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/export/latest`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load export status');
  }
  const data = (await response.json()) as { job: DataExportJob | null };
  return data.job;
}

export async function deleteAccount(accessToken: string): Promise<AccountDeletionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete account');
  }
  return response.json() as Promise<AccountDeletionResponse>;
}

export async function fetchAnalyticsDashboard(accessToken: string): Promise<AnalyticsDashboard> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load analytics');
  }
  return response.json() as Promise<AnalyticsDashboard>;
}

export async function fetchPersonalRecords(
  accessToken: string,
  limit = 200,
): Promise<PersonalRecordSummary[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/analytics/personal-records?limit=${String(limit)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load personal records');
  }
  const data = (await response.json()) as { items: PersonalRecordSummary[] };
  return data.items;
}

export async function fetchSupplements(
  accessToken: string,
  locale?: string,
): Promise<SupplementListItem[]> {
  const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` };
  if (locale) {
    headers['Accept-Language'] = locale;
  }
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements`, {
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load supplements');
  }
  const data = (await response.json()) as { supplements: SupplementListItem[] };
  return data.supplements;
}

export async function createSupplement(
  accessToken: string,
  payload: CreateSupplementInput,
): Promise<SupplementDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to create supplement');
  }
  return response.json() as Promise<SupplementDetail>;
}

export async function updateSupplement(
  accessToken: string,
  supplementId: string,
  payload: UpdateSupplementInput,
): Promise<SupplementDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements/${supplementId}`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update supplement');
  }
  return response.json() as Promise<SupplementDetail>;
}

export async function deleteSupplement(accessToken: string, supplementId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements/${supplementId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete supplement');
  }
}

export async function fetchTodaySupplements(
  accessToken: string,
  locale?: string,
): Promise<TodaySupplementsResponse> {
  const today = todayDateString();
  const params = new URLSearchParams({
    from: today + 'T00:00:00.000Z',
    to: today + 'T23:59:59.999Z',
    limit: '50',
  });
  if (locale) params.set('locale', locale);
  const response = await fetch(API_BASE_URL + '/api/v1/supplements/logs?' + params.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load today supplements');
  }
  const data = (await response.json()) as SupplementLogListResponse;
  return {
    date: today,
    logs: data.logs,
    totalCount: data.logs.length,
  };
}

export async function createSupplementLog(
  accessToken: string,
  payload: CreateSupplementLogInput,
): Promise<SupplementLogItem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements/logs`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to log supplement');
  }
  return response.json() as Promise<SupplementLogItem>;
}

export async function deleteSupplementLog(accessToken: string, logId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements/logs/${logId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete supplement log');
  }
}

export async function repeatYesterdaySupplements(
  accessToken: string,
  date: string,
): Promise<TodaySupplementsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements/logs/repeat-yesterday`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify({ date }),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to repeat yesterday');
  }
  return response.json() as Promise<TodaySupplementsResponse>;
}

export async function fetchSupplementTrend(
  accessToken: string,
  days = 30,
  locale?: string,
): Promise<SupplementTrendItem[]> {
  const params = new URLSearchParams({ days: String(days) });
  if (locale) params.set('locale', locale);
  const response = await fetch(`${API_BASE_URL}/api/v1/supplements/trend?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load supplement trend');
  }
  return response.json() as Promise<SupplementTrendItem[]>;
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

export async function addWorkoutExerciseSet(
  accessToken: string,
  sessionId: string,
  executionId: string,
  payload: AddWorkoutSetInput,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/exercises/${executionId}/sets`,
    {
      method: 'POST',
      headers: authHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to add set');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function skipWorkoutExercise(
  accessToken: string,
  sessionId: string,
  executionId: string,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/exercises/${executionId}/skip`,
    {
      method: 'POST',
      headers: authHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify({}),
    },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to skip exercise');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function substituteWorkoutExercise(
  accessToken: string,
  sessionId: string,
  executionId: string,
  payload: SubstituteExerciseInput,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/exercises/${executionId}/substitute`,
    {
      method: 'POST',
      headers: authHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to substitute exercise');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function updateWorkoutSessionNotes(
  accessToken: string,
  sessionId: string,
  payload: UpdateWorkoutSessionNotesInput,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/notes`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update session notes');
  }
  return response.json() as Promise<WorkoutSessionDetail>;
}

export async function updateWorkoutExerciseNotes(
  accessToken: string,
  sessionId: string,
  executionId: string,
  payload: UpdateWorkoutExerciseNotesInput,
): Promise<WorkoutSessionDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workouts/sessions/${sessionId}/exercises/${executionId}/notes`,
    {
      method: 'PATCH',
      headers: authHeaders(accessToken),
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update exercise notes');
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
