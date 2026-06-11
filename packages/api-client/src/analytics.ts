import type { AnalyticsDashboard } from '@onemore/shared';

import type { ApiClient } from './client.js';

/**
 * Analytics API methods.
 */
export class AnalyticsApi {
  /**
   * @param client - Parent API client.
   */
  constructor(private readonly client: ApiClient) {}

  async getDashboard(): Promise<AnalyticsDashboard> {
    return this.client.getJson<AnalyticsDashboard>('/api/v1/analytics/dashboard');
  }
}
