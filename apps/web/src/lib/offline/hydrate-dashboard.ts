import type { HistoryListResponse, PersonalRecordSummary } from '@onemore/shared';

import { fetchHistorySessions, fetchPersonalRecords } from '@/lib/api-auth';

import { offlineDb } from './db';

const HYDRATE_SESSION_LIMIT = 50;
const MAX_HYDRATE_PAGES = 6;

/**
 * Paginate history sessions into IndexedDB for dashboard KPI computation.
 *
 * @param accessToken - Bearer access token.
 */
export async function hydrateCompletedSessions(accessToken: string): Promise<void> {
  let cursor: string | undefined;
  const allItems: HistoryListResponse['items'] = [];

  for (let page = 0; page < MAX_HYDRATE_PAGES; page += 1) {
    const response = await fetchHistorySessions(accessToken, {
      limit: HYDRATE_SESSION_LIMIT,
      cursor,
    });
    allItems.push(...response.items);
    if (!response.nextCursor) {
      break;
    }
    cursor = response.nextCursor;
  }

  if (allItems.length === 0) {
    return;
  }

  await offlineDb.completedSessions.bulkPut(allItems);
}

/**
 * Download personal records for monthly PR KPI computation.
 *
 * @param accessToken - Bearer access token.
 */
export async function hydratePersonalRecords(accessToken: string): Promise<void> {
  const records = await fetchPersonalRecords(accessToken, 200);
  if (records.length === 0) {
    return;
  }
  await offlineDb.personalRecords.bulkPut(records);
}

/**
 * Hydrate dashboard-related offline data after login or background sync.
 *
 * @param accessToken - Bearer access token.
 */
export async function hydrateDashboardData(accessToken: string): Promise<void> {
  await Promise.all([
    hydrateCompletedSessions(accessToken),
    hydratePersonalRecords(accessToken),
  ]);
}

/**
 * Replace personal records in IndexedDB after a server fetch.
 *
 * @param records - Personal record rows from the API.
 */
export async function replacePersonalRecords(records: PersonalRecordSummary[]): Promise<void> {
  await offlineDb.personalRecords.clear();
  if (records.length > 0) {
    await offlineDb.personalRecords.bulkPut(records);
  }
}
