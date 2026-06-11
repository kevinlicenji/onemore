import { Queue, Worker, type Job } from 'bullmq';
import type { Redis } from 'ioredis';

export const JOB_QUEUE_NAME = 'onemore-jobs';

export type JobName = 'gdpr-export' | 'hard-delete-users' | 'workout-reminders';

export interface GdprExportJobData {
  jobId: string;
}

/**
 * Create BullMQ queue when Redis is available.
 *
 * @param redis - Redis connection.
 */
export function createJobQueue(redis: Redis): Queue {
  return new Queue(JOB_QUEUE_NAME, { connection: redis });
}

/**
 * Register background job workers.
 *
 * @param redis - Redis connection.
 * @param handlers - Job name to handler map.
 */
export function createJobWorker(
  redis: Redis,
  handlers: Record<JobName, (job: Job) => Promise<void>>,
): Worker {
  return new Worker(
    JOB_QUEUE_NAME,
    async (job) => {
      const name = job.name as JobName;
      if (!(name in handlers)) {
        throw new Error(`Unknown job: ${job.name}`);
      }
      await handlers[name](job);
    },
    { connection: redis },
  );
}
