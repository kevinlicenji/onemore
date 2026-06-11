import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';

import type { Env } from '../config/env.js';
import type { GdprExportService } from '../modules/gdpr/gdpr-export.service.js';
import type { PrivacyService } from '../modules/gdpr/privacy.service.js';
import type { PushService } from '../modules/notifications/push.service.js';
import type { Logger } from '../lib/logger.js';
import { createJobQueue, createJobWorker, type GdprExportJobData, type JobName } from './queue.js';

/**
 * Start BullMQ workers and repeatable schedules when Redis is configured.
 *
 * @param redis - Redis client.
 * @param deps - Services used by job handlers.
 */
export function registerBackgroundJobs(
  redis: Redis,
  deps: {
    env: Env;
    logger: Logger;
    gdprExportService: GdprExportService;
    privacyService: PrivacyService;
    pushService: PushService;
  },
): { queue: Queue } {
  const queue = createJobQueue(redis);

  const handlers: Record<JobName, (job: { data: unknown }) => Promise<void>> = {
    'gdpr-export': async (job) => {
      const data = job.data as GdprExportJobData;
      await deps.gdprExportService.processExportJob(data.jobId);
    },
    'hard-delete-users': async () => {
      const count = await deps.privacyService.processHardDeletes();
      deps.logger.info({ count }, 'Hard delete job completed');
    },
    'workout-reminders': async () => {
      const count = await deps.pushService.sendWorkoutReminders();
      deps.logger.info({ count }, 'Workout reminder job completed');
    },
  };

  createJobWorker(redis, handlers);

  void queue.add(
    'hard-delete-users',
    {},
    { repeat: { pattern: '0 3 * * *' }, jobId: 'hard-delete-users-daily' },
  );
  void queue.add(
    'workout-reminders',
    {},
    { repeat: { pattern: '0 10 * * 3' }, jobId: 'workout-reminders-weekly' },
  );

  return { queue };
}

/**
 * Enqueue GDPR export processing.
 *
 * @param queue - BullMQ queue or null for inline processing.
 * @param jobId - Export job id.
 * @param processInline - Fallback when queue unavailable.
 */
export async function enqueueGdprExport(
  queue: Queue | null,
  jobId: string,
  processInline: () => Promise<void>,
): Promise<void> {
  if (queue) {
    await queue.add('gdpr-export', { jobId } satisfies GdprExportJobData);
    return;
  }
  await processInline();
}
