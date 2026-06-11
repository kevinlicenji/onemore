import type { HistoryListQuery, HistoryListResponse, WorkoutSessionDetail } from '@onemore/shared';

import type { ApiClient } from './client.js';

/**
 * Workout history API methods.
 */
export class HistoryApi {
  /**
   * @param client - Parent API client.
   */
  constructor(private readonly client: ApiClient) {}

  async listSessions(query: HistoryListQuery = { limit: 20 }): Promise<HistoryListResponse> {
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
    const path = qs ? `/api/v1/history/sessions?${qs}` : '/api/v1/history/sessions';
    return this.client.getJson<HistoryListResponse>(path);
  }

  async getSession(sessionId: string): Promise<WorkoutSessionDetail> {
    return this.client.getJson<WorkoutSessionDetail>(`/api/v1/history/sessions/${sessionId}`);
  }
}
