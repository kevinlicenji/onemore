import type {
  ExerciseListItem,
  NextWorkoutPreview,
  SyncMutation,
  WorkoutSessionDetail,
} from '@onemore/shared';
import Dexie, { type Table } from 'dexie';

export interface LocalExercise extends ExerciseListItem {
  updatedAt: string;
}

export interface SyncQueueRow {
  id: string;
  mutation: SyncMutation;
  createdAt: string;
  attempts: number;
}

export interface SyncMetadataRow {
  id: 'default';
  userId: string;
  lastSyncedAt: string | null;
  lastDeltaAt: string | null;
}

/**
 * IndexedDB schema for offline workout execution and sync queue.
 */
export class OneMoreOfflineDb extends Dexie {
  exercises!: Table<LocalExercise, string>;
  nextWorkout!: Table<NextWorkoutPreview & { id: 'default' }, string>;
  sessions!: Table<WorkoutSessionDetail, string>;
  syncQueue!: Table<SyncQueueRow, string>;
  syncMetadata!: Table<SyncMetadataRow, string>;

  /**
   * Configure Dexie tables and indexes.
   */
  constructor() {
    super('onemore_offline');
    this.version(1).stores({
      exercises: 'id, slug, category, updatedAt',
      nextWorkout: 'id',
      sessions: 'id, status, startedAt',
      syncQueue: 'id, createdAt',
      syncMetadata: 'id',
    });
  }
}

export const offlineDb = new OneMoreOfflineDb();
