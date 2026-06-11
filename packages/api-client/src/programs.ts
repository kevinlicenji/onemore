import type {
  CreateProgramInput,
  ExerciseListItem,
  ProgramDetail,
  ProgramSummary,
  TemplateSummary,
} from '@onemore/shared';

import type { ApiClient } from './client.js';

/**
 * Exercise catalog API methods.
 */
export class ExercisesApi {
  /**
   * @param client - Parent API client.
   */
  constructor(private readonly client: ApiClient) {}

  /**
   * Search exercises by term.
   *
   * @param query - Search string.
   * @param limit - Max results.
   */
  async search(query: string, limit = 20): Promise<ExerciseListItem[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const data = await this.client.getJson<{ exercises: ExerciseListItem[] }>(
      `/api/v1/exercises?${params.toString()}`,
    );
    return data.exercises;
  }
}

/**
 * Program management API methods.
 */
export class ProgramsApi {
  /**
   * @param client - Parent API client.
   */
  constructor(private readonly client: ApiClient) {}

  async list(): Promise<ProgramSummary[]> {
    const data = await this.client.getJson<{ programs: ProgramSummary[] }>('/api/v1/programs');
    return data.programs;
  }

  async listTemplates(): Promise<TemplateSummary[]> {
    const data = await this.client.getJson<{ templates: TemplateSummary[] }>(
      '/api/v1/programs/templates',
    );
    return data.templates;
  }

  async create(payload: CreateProgramInput): Promise<ProgramDetail> {
    return this.client.postJson<ProgramDetail>('/api/v1/programs', payload);
  }

  async publish(programId: string): Promise<ProgramDetail> {
    return this.client.postJson<ProgramDetail>(`/api/v1/programs/${programId}/publish`, {});
  }

  async applyTemplate(slug: string): Promise<ProgramDetail> {
    return this.client.postJson<ProgramDetail>(`/api/v1/programs/templates/${slug}/apply`, {});
  }
}
