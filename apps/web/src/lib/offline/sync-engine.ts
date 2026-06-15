import type {
  ExerciseListItem,
  NextWorkoutPreview,
  SyncBatchResponse,
  SyncMutation,
  WorkoutSessionDetail,
} from '@onemore/shared';
import { EXERCISE_CATALOG_LIMIT } from '@onemore/shared';

import { API_BASE_URL } from '@/lib/api-config';
import { generateClientUuid } from '@/lib/generate-client-uuid';

import { emitDashboardInvalidation } from '@/lib/dashboard/dashboard-events';
import { invalidateDashboardCache } from '@/lib/dashboard/dashboard-cache';

import { offlineDb } from './db';
import { sessionDetailToHistorySummary } from './dashboard-store';

const MAX_SYNC_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Calculate exponential backoff delay with jitter.
 *
 * @param attempt - Current attempt number (0-indexed).
 * @returns Delay in milliseconds.
 */
function calculateBackoff(attempt: number): number {
  const exponentialDelay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Sleep for the specified duration.
 *
 * @param ms - Milliseconds to sleep.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @returns Whether the browser reports an online network state.
 */
export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/**
 * Append a mutation to the durable sync queue.
 *
 * @param mutation - Client mutation payload.
 */
export async function enqueueMutation(mutation: SyncMutation): Promise<void> {
  await offlineDb.syncQueue.put({
    id: `${mutation.type}:${mutation.payload.id}`,
    mutation,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
}

/**
 * Count queued mutations waiting for server ACK.
 */
export async function getPendingSyncCount(): Promise<number> {
  return offlineDb.syncQueue.count();
}

/**
 * Push queued mutations to the sync batch endpoint with exponential backoff retry.
 *
 * @param accessToken - Bearer access token.
 */
export async function flushSyncQueue(accessToken: string): Promise<SyncBatchResponse | null> {
  if (!isBrowserOnline()) {
    return null;
  }

  const rows = await offlineDb.syncQueue.orderBy('createdAt').toArray();
  if (rows.length === 0) {
    return null;
  }

  let lastError: Error | null = null;

  for (const row of rows) {
    if (row.attempts >= MAX_SYNC_ATTEMPTS) {
      continue;
    }
  }

  const attemptRows = rows.filter((row) => row.attempts < MAX_SYNC_ATTEMPTS);
  if (attemptRows.length === 0) {
    return null;
  }

  const maxAttempts = Math.max(...attemptRows.map((r) => r.attempts));

  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    if (!isBrowserOnline()) {
      return null;
    }

    const currentRows = await offlineDb.syncQueue
      .where('attempts')
      .below(MAX_SYNC_ATTEMPTS)
      .sortBy('createdAt');

    if (currentRows.length === 0) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/sync/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': generateClientUuid(),
      },
      credentials: 'include',
      body: JSON.stringify({
        clientSyncId: generateClientUuid(),
        mutations: currentRows.map((row) => row.mutation),
      }),
    });

    if (!response.ok) {
      lastError = new Error(`Sync failed: ${String(response.status)}`);

      const rowsToUpdate = currentRows.map((row) => ({
        ...row,
        attempts: row.attempts + 1,
      }));
      await offlineDb.syncQueue.bulkPut(rowsToUpdate);

      if (attempt < maxAttempts) {
        const delay = calculateBackoff(attempt);
        await sleep(delay);
        continue;
      }

      throw lastError;
    }

    const result = (await response.json()) as SyncBatchResponse;
    const acknowledged = new Set(result.acknowledged);

    const idsToRemove = currentRows
      .filter((row) => acknowledged.has(row.mutation.payload.id))
      .map((row) => row.id);

    await offlineDb.syncQueue.bulkDelete(idsToRemove);

    const metadata = await offlineDb.syncMetadata.get('default');
    await offlineDb.syncMetadata.put({
      id: 'default',
      userId: metadata?.userId ?? '',
      lastSyncedAt: result.serverTime,
      lastDeltaAt: metadata?.lastDeltaAt ?? null,
    });

    return result;
  }

  throw lastError ?? new Error('Sync failed after max attempts');
}

/**
 * Pull server delta and refresh local exercise catalog and sessions.
 *
 * @param accessToken - Bearer access token.
 * @param userId - Authenticated user id.
 */
export async function pullDelta(accessToken: string, userId: string): Promise<void> {
  if (!isBrowserOnline()) {
    return;
  }

  const metadata = await offlineDb.syncMetadata.get('default');
  const since = metadata?.lastDeltaAt ?? undefined;
  const params = since ? `?since=${encodeURIComponent(since)}` : '';

  const response = await fetch(`${API_BASE_URL}/api/v1/sync/delta${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Delta pull failed: ${String(response.status)}`);
  }

  const delta = (await response.json()) as {
    serverTime: string;
    exercises: ExerciseListItem[];
    nextWorkout: NextWorkoutPreview;
    sessions: WorkoutSessionDetail[];
  };

  if (delta.exercises.length > 0) {
    await offlineDb.exercises.bulkPut(
      delta.exercises.map((exercise) => ({
        ...exercise,
        updatedAt: delta.serverTime,
      })),
    );
  }

  await offlineDb.nextWorkout.put({ ...delta.nextWorkout, id: 'default' });

  if (delta.sessions.length > 0) {
    await offlineDb.sessions.bulkPut(delta.sessions);
    const completedSummaries = delta.sessions
      .filter((session) => session.status === 'completed' && session.completedAt)
      .map((session) => sessionDetailToHistorySummary(session));
    if (completedSummaries.length > 0) {
      await offlineDb.completedSessions.bulkPut(completedSummaries);
    }
  }

  invalidateDashboardCache();
  emitDashboardInvalidation('SYNC_COMPLETE');

  await offlineDb.syncMetadata.put({
    id: 'default',
    userId,
    lastSyncedAt: metadata?.lastSyncedAt ?? null,
    lastDeltaAt: delta.serverTime,
  });
}

/**
 * Download exercise catalog and next workout snapshot after login.
 *
 * @param accessToken - Bearer access token.
 * @param userId - Authenticated user id.
 */
export async function hydrateOfflineCatalog(accessToken: string, userId: string): Promise<void> {
  if (!isBrowserOnline()) {
    return;
  }

  const [exercisesResponse, previewResponse, activeResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/v1/exercises?limit=${String(EXERCISE_CATALOG_LIMIT)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    }),
    fetch(`${API_BASE_URL}/api/v1/workouts/next`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    }),
    fetch(`${API_BASE_URL}/api/v1/workouts/sessions/active`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    }),
  ]);

  if (!exercisesResponse.ok || !previewResponse.ok || !activeResponse.ok) {
    throw new Error('Failed to hydrate offline catalog');
  }

  const exercisesData = (await exercisesResponse.json()) as { exercises: ExerciseListItem[] };
  const preview = (await previewResponse.json()) as NextWorkoutPreview;
  const activeData = (await activeResponse.json()) as { session: WorkoutSessionDetail | null };

  const now = new Date().toISOString();
  await offlineDb.exercises.clear();
  await offlineDb.exercises.bulkPut(
    exercisesData.exercises.map((exercise) => ({ ...exercise, updatedAt: now })),
  );
  await offlineDb.nextWorkout.put({ ...preview, id: 'default' });
  if (activeData.session) {
    await offlineDb.sessions.put(activeData.session);
  }

  await offlineDb.syncMetadata.put({
    id: 'default',
    userId,
    lastSyncedAt: now,
    lastDeltaAt: now,
  });
}
