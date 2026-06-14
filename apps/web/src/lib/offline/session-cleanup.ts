import { offlineDb } from './db';

/**
 * Removes every locally cached in-progress workout session.
 */
export async function purgeInProgressSessions(): Promise<void> {
  const rows = await offlineDb.sessions.where('status').equals('in_progress').toArray();
  if (rows.length === 0) {
    return;
  }
  await offlineDb.sessions.bulkDelete(rows.map((row) => row.id));
}

/**
 * Removes a single session from local cache (e.g. after server 404).
 */
export async function purgeLocalSession(sessionId: string): Promise<void> {
  await offlineDb.sessions.delete(sessionId);
}

/**
 * Clears workout-related offline cache when the authenticated user changes.
 */
export async function clearOfflineWorkoutCache(): Promise<void> {
  await offlineDb.sessions.clear();
  await offlineDb.syncQueue.clear();
  await offlineDb.nextWorkout.clear();
}
