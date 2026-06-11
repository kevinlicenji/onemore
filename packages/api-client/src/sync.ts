import type { SyncBatchRequest, SyncBatchResponse, SyncDeltaResponse } from '@onemore/shared';

import type { ApiClient } from './client.js';

/**
 * Offline sync API methods.
 */
export class SyncApi {
  /**
   * @param client - Parent API client.
   */
  constructor(private readonly client: ApiClient) {}

  /**
   * Push a batch of offline mutations to the server.
   *
   * @param payload - Ordered mutation batch.
   * @param idempotencyKey - Unique key for safe retries.
   */
  async pushBatch(payload: SyncBatchRequest, idempotencyKey: string): Promise<SyncBatchResponse> {
    return this.client.postJson<SyncBatchResponse>('/api/v1/sync/batch', payload, {
      'Idempotency-Key': idempotencyKey,
    });
  }

  async pullDelta(since?: string): Promise<SyncDeltaResponse> {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.client.getJson<SyncDeltaResponse>(`/api/v1/sync/delta${params}`);
  }
}
