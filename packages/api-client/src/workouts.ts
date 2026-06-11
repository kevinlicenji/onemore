import type {
  AddWorkoutExerciseInput,
  NextWorkoutPreview,
  StartWorkoutSessionInput,
  UpsertSetLogInput,
  UpsertSetResponse,
  WorkoutSessionDetail,
} from '@onemore/shared';

import type { ApiClient } from './client.js';

/**
 * Workout session API methods.
 */
export class WorkoutsApi {
  /**
   * @param client - Parent API client.
   */
  constructor(private readonly client: ApiClient) {}

  async getNextWorkout(): Promise<NextWorkoutPreview> {
    return this.client.getJson<NextWorkoutPreview>('/api/v1/workouts/next');
  }

  async getActiveSession(): Promise<WorkoutSessionDetail | null> {
    const data = await this.client.getJson<{ session: WorkoutSessionDetail | null }>(
      '/api/v1/workouts/sessions/active',
    );
    return data.session;
  }

  async startSession(payload: StartWorkoutSessionInput): Promise<WorkoutSessionDetail> {
    return this.client.postJson<WorkoutSessionDetail>('/api/v1/workouts/sessions', payload);
  }

  async getSession(sessionId: string): Promise<WorkoutSessionDetail> {
    return this.client.getJson<WorkoutSessionDetail>(`/api/v1/workouts/sessions/${sessionId}`);
  }

  async upsertSet(sessionId: string, payload: UpsertSetLogInput): Promise<UpsertSetResponse> {
    return this.client.putJson<UpsertSetResponse>(
      `/api/v1/workouts/sessions/${sessionId}/sets`,
      payload,
    );
  }

  async addExercise(
    sessionId: string,
    payload: AddWorkoutExerciseInput,
  ): Promise<WorkoutSessionDetail> {
    return this.client.postJson<WorkoutSessionDetail>(
      `/api/v1/workouts/sessions/${sessionId}/exercises`,
      payload,
    );
  }

  async completeSession(sessionId: string): Promise<WorkoutSessionDetail> {
    return this.client.postJson<WorkoutSessionDetail>(
      `/api/v1/workouts/sessions/${sessionId}/complete`,
      {},
    );
  }

  async abandonSession(sessionId: string): Promise<WorkoutSessionDetail> {
    return this.client.postJson<WorkoutSessionDetail>(
      `/api/v1/workouts/sessions/${sessionId}/abandon`,
      {},
    );
  }
}
