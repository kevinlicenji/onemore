import type {
  AdminCreateSupplement,
  AdminCreateSystemExercise,
  AdminCreateTemplate,
  AdminDuplicateTemplate,
  AdminSupplement,
  AdminSystemExercise,
  AdminTemplateDetail,
  AdminTemplateListItem,
  AdminUpdateSupplement,
  AdminUpdateSystemExercise,
  AdminUpdateTemplate,
  CreateProgramInput,
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

export async function fetchAdminExercises(accessToken: string): Promise<AdminSystemExercise[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/exercises`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load admin exercises');
  }
  const body = (await response.json()) as { exercises: AdminSystemExercise[] };
  return body.exercises;
}

export async function createAdminExercise(
  accessToken: string,
  payload: AdminCreateSystemExercise,
): Promise<AdminSystemExercise> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/exercises`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to create exercise');
  }
  return response.json() as Promise<AdminSystemExercise>;
}

export async function updateAdminExercise(
  accessToken: string,
  exerciseId: string,
  payload: AdminUpdateSystemExercise,
): Promise<AdminSystemExercise> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/exercises/${exerciseId}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update exercise');
  }
  return response.json() as Promise<AdminSystemExercise>;
}

export async function deleteAdminExercise(
  accessToken: string,
  exerciseId: string,
): Promise<AdminSystemExercise> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/exercises/${exerciseId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete exercise');
  }
  return response.json() as Promise<AdminSystemExercise>;
}

export async function fetchAdminSupplements(accessToken: string): Promise<AdminSupplement[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/supplements`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load admin supplements');
  }
  const body = (await response.json()) as { supplements: AdminSupplement[] };
  return body.supplements;
}

export async function createAdminSupplement(
  accessToken: string,
  payload: AdminCreateSupplement,
): Promise<AdminSupplement> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/supplements`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to create supplement');
  }
  return response.json() as Promise<AdminSupplement>;
}

export async function updateAdminSupplement(
  accessToken: string,
  supplementId: string,
  payload: AdminUpdateSupplement,
): Promise<AdminSupplement> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/supplements/${supplementId}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update supplement');
  }
  return response.json() as Promise<AdminSupplement>;
}

export async function deleteAdminSupplement(
  accessToken: string,
  supplementId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/supplements/${supplementId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete supplement');
  }
}

export async function fetchAdminTemplates(accessToken: string): Promise<AdminTemplateListItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load admin templates');
  }
  const body = (await response.json()) as { templates: AdminTemplateListItem[] };
  return body.templates;
}

export async function fetchAdminTemplateDetail(
  accessToken: string,
  slug: string,
): Promise<AdminTemplateDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates/${slug}`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to load admin template');
  }
  return response.json() as Promise<AdminTemplateDetail>;
}

export async function createAdminTemplate(
  accessToken: string,
  payload: AdminCreateTemplate,
): Promise<AdminTemplateDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to create template');
  }
  return response.json() as Promise<AdminTemplateDetail>;
}

export async function updateAdminTemplate(
  accessToken: string,
  slug: string,
  payload: AdminUpdateTemplate,
): Promise<AdminTemplateDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates/${slug}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update template');
  }
  return response.json() as Promise<AdminTemplateDetail>;
}

export async function duplicateAdminTemplate(
  accessToken: string,
  sourceSlug: string,
  payload: AdminDuplicateTemplate,
): Promise<AdminTemplateDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates/${sourceSlug}/duplicate`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to duplicate template');
  }
  return response.json() as Promise<AdminTemplateDetail>;
}

export async function publishAdminTemplate(
  accessToken: string,
  slug: string,
): Promise<AdminTemplateDetail> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates/${slug}/publish`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to publish template');
  }
  return response.json() as Promise<AdminTemplateDetail>;
}

export async function deleteAdminTemplate(accessToken: string, slug: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/templates/${slug}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to delete template');
  }
}

export async function findAdminUserByUsername(
  accessToken: string,
  username: string,
): Promise<{ id: string; username: string | null; isAdmin: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/by-username/${username}`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to find user');
  }
  const body = (await response.json()) as {
    user: { id: string; username: string | null; isAdmin: boolean };
  };
  return body.user;
}

export async function setUserAdmin(
  accessToken: string,
  userId: string,
  isAdmin: boolean,
): Promise<{ id: string; username: string | null; isAdmin: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/admin`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    credentials: 'include',
    body: JSON.stringify({ isAdmin }),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Failed to update admin status');
  }
  const body = (await response.json()) as {
    user: { id: string; username: string | null; isAdmin: boolean };
  };
  return body.user;
}

/**
 * Map program builder output to admin template days payload.
 */
export function mapBuilderDaysToAdminDays(input: CreateProgramInput): AdminCreateTemplate['days'] {
  return input.days;
}
