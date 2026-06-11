import './instrument.js';

import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { EmailService } from './lib/email.js';
import { createLogger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { createRedisClient } from './lib/redis.js';
import type { Queue } from 'bullmq';

import { registerBackgroundJobs } from './jobs/register-workers.js';
import { GdprExportService } from './modules/gdpr/gdpr-export.service.js';
import { PrivacyService } from './modules/gdpr/privacy.service.js';
import { PushService } from './modules/notifications/push.service.js';

const env = loadEnv();
const logger = createLogger(env);
const redis = createRedisClient(env);

let jobQueue: Queue | null = null;

async function start(): Promise<void> {
  if (redis) {
    try {
      if (redis.status !== 'ready') {
        await redis.connect();
      }
      const emailService = new EmailService(env, logger);
      const gdprExportService = new GdprExportService(prisma, env, emailService, logger);
      const privacyService = new PrivacyService(prisma, logger);
      const pushService = new PushService(prisma, env, logger);
      const workers = registerBackgroundJobs(redis, {
        env,
        logger,
        gdprExportService,
        privacyService,
        pushService,
      });
      jobQueue = workers.queue;
      logger.info('Background job workers started');
    } catch (error) {
      logger.warn({ err: error }, 'Redis unavailable; background jobs disabled');
    }
  }

  const app = createApp(env, logger, { redis, jobQueue });
  app.listen(env.API_PORT, () => {
    logger.info({ port: env.API_PORT }, 'API server listening');
  });
}

void start();
