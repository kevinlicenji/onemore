import type {
  CreateSupplementInput,
  CreateSupplementLogInput,
  SupplementDetail,
  SupplementListItem,
  SupplementLogItem,
  SupplementLogListResponse,
  SupplementTrendItem,
  TodaySupplementsResponse,
  UpdateSupplementInput,
} from '@onemore/shared';

import type { ApiClient } from './client.js';

export class SupplementsApi {
  constructor(private readonly client: ApiClient) {}

  async list(locale?: string): Promise<SupplementListItem[]> {
    const path = locale ? `/api/v1/supplements?locale=${locale}` : '/api/v1/supplements';
    const data = await this.client.getJson<{ supplements: SupplementListItem[] }>(path);
    return data.supplements;
  }

  async getById(supplementId: string, locale?: string): Promise<SupplementDetail> {
    const path = locale
      ? `/api/v1/supplements/${supplementId}?locale=${locale}`
      : `/api/v1/supplements/${supplementId}`;
    return this.client.getJson<SupplementDetail>(path);
  }

  async create(payload: CreateSupplementInput): Promise<SupplementDetail> {
    return this.client.postJson<SupplementDetail>('/api/v1/supplements', payload);
  }

  async update(supplementId: string, payload: UpdateSupplementInput): Promise<SupplementDetail> {
    return this.client.putJson<SupplementDetail>(`/api/v1/supplements/${supplementId}`, payload);
  }

  async delete(supplementId: string): Promise<void> {
    return this.client.deleteJson(`/api/v1/supplements/${supplementId}`);
  }

  async listLogs(params: {
    from?: string;
    to?: string;
    supplementId?: string;
    limit?: number;
    cursor?: string;
    locale?: string;
  }): Promise<SupplementLogListResponse> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.supplementId) searchParams.set('supplementId', params.supplementId);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.locale) searchParams.set('locale', params.locale);

    const qs = searchParams.toString();
    return this.client.getJson<SupplementLogListResponse>(
      `/api/v1/supplements/logs${qs ? `?${qs}` : ''}`,
    );
  }

  async createLog(
    payload: CreateSupplementLogInput,
    locale?: string,
  ): Promise<SupplementLogItem> {
    const path = locale ? `/api/v1/supplements/logs?locale=${locale}` : '/api/v1/supplements/logs';
    return this.client.postJson<SupplementLogItem>(path, payload);
  }

  async updateLog(
    logId: string,
    payload: Partial<CreateSupplementLogInput>,
  ): Promise<SupplementLogItem> {
    return this.client.putJson<SupplementLogItem>(`/api/v1/supplements/logs/${logId}`, payload);
  }

  async deleteLog(logId: string): Promise<void> {
    return this.client.deleteJson(`/api/v1/supplements/logs/${logId}`);
  }

  async repeatYesterday(date: string, locale?: string): Promise<TodaySupplementsResponse> {
    const path = locale
      ? `/api/v1/supplements/logs/repeat-yesterday?locale=${locale}`
      : '/api/v1/supplements/logs/repeat-yesterday';
    return this.client.postJson<TodaySupplementsResponse>(path, { date });
  }

  async getTrend(days = 30, locale?: string): Promise<SupplementTrendItem[]> {
    const params = new URLSearchParams({ days: String(days) });
    if (locale) params.set('locale', locale);
    return this.client.getJson<SupplementTrendItem[]>(
      `/api/v1/supplements/trend?${params.toString()}`,
    );
  }
}
