import type {
  InsertManualMaxInput,
  MaxHistoryLogWithExercise,
  ResolvePendingMaxInput,
  UserExerciseMaxWithExercise,
} from '@onemore/shared';

import type { ApiClient } from './client.js';

export class MaxValuesApi {
  constructor(private readonly client: ApiClient) {}

  async listActive(): Promise<UserExerciseMaxWithExercise[]> {
    const data = await this.client.getJson<{ maxValues: UserExerciseMaxWithExercise[] }>(
      '/api/v1/max-values',
    );
    return data.maxValues;
  }

  async insertManual(payload: InsertManualMaxInput): Promise<UserExerciseMaxWithExercise> {
    return this.client.postJson<UserExerciseMaxWithExercise>('/api/v1/max-values/manual', payload);
  }

  async listPending(): Promise<MaxHistoryLogWithExercise[]> {
    const data = await this.client.getJson<{ pending: MaxHistoryLogWithExercise[] }>(
      '/api/v1/max-values/pending',
    );
    return data.pending;
  }

  async resolvePending(logId: string, payload: ResolvePendingMaxInput): Promise<void> {
    await this.client.postJson(`/api/v1/max-values/pending/${logId}/resolve`, payload);
  }

  async getHistory(exerciseId: string): Promise<MaxHistoryLogWithExercise[]> {
    const data = await this.client.getJson<{ history: MaxHistoryLogWithExercise[] }>(
      `/api/v1/max-values/history/${exerciseId}`,
    );
    return data.history;
  }
}
