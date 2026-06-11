import { Router } from 'express';

import type { Env } from '../config/env.js';
import { EmailService } from '../lib/email.js';
import { prisma } from '../lib/prisma.js';
import type { RedisClient } from '../lib/redis.js';
import type { Logger } from '../lib/logger.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import { OAuthService } from '../modules/auth/oauth.service.js';
import { ExercisesService } from '../modules/exercises/exercises.service.js';
import { GdprExportService } from '../modules/gdpr/gdpr-export.service.js';
import { PrivacyService } from '../modules/gdpr/privacy.service.js';
import { OnboardingService } from '../modules/onboarding/onboarding.service.js';
import { PushService } from '../modules/notifications/push.service.js';
import { ProgramsService } from '../modules/programs/programs.service.js';
import { AnalyticsService } from '../modules/analytics/analytics.service.js';
import { HistoryService } from '../modules/history/history.service.js';
import { PrDetectionService } from '../modules/progress/pr-detection.service.js';
import { SyncService } from '../modules/sync/sync.service.js';
import { WorkoutsService } from '../modules/workouts/workouts.service.js';
import type { UsersService } from '../modules/users/users.service.js';
import { createAuthenticateMiddleware } from '../middleware/authenticate.js';
import type { Queue } from 'bullmq';
import { createAuthRouter } from './auth.routes.js';
import { createExercisesRouter } from './exercises.routes.js';
import { createOnboardingRouter } from './onboarding.routes.js';
import { createProgramsRouter } from './programs.routes.js';
import { createAnalyticsRouter } from './analytics.routes.js';
import { createHistoryRouter } from './history.routes.js';
import { createNotificationsRouter } from './notifications.routes.js';
import { createSyncRouter } from './sync.routes.js';
import { createWorkoutsRouter } from './workouts.routes.js';
import { createUsersRouter } from './users.routes.js';

export interface V1RouterDeps {
  env: Env;
  authService: AuthService;
  usersService: UsersService;
  redis: RedisClient | null;
  jobQueue: Queue | null;
  logger: Logger;
}

/**
 * API v1 route aggregator.
 */
export function createV1Router(deps: V1RouterDeps): Router {
  const router = Router();
  const oauthService = new OAuthService(deps.env);
  const authenticate = createAuthenticateMiddleware(deps.authService);
  const onboardingService = new OnboardingService(prisma, deps.usersService);
  const exercisesService = new ExercisesService(prisma);
  const programsService = new ProgramsService(prisma);
  const prDetection = new PrDetectionService();
  const workoutsService = new WorkoutsService(prisma, prDetection);
  const syncService = new SyncService(prisma, workoutsService, prDetection);
  const historyService = new HistoryService(prisma, workoutsService);
  const analyticsService = new AnalyticsService(prisma, workoutsService, prDetection);

  const emailService = new EmailService(deps.env, deps.logger);
  const gdprExportService = new GdprExportService(prisma, deps.env, emailService, deps.logger);
  const privacyService = new PrivacyService(prisma, deps.logger);
  const pushService = new PushService(prisma, deps.env, deps.logger);

  router.get('/', (_req, res) => {
    res.json({ message: 'OneMore API v1' });
  });

  router.use(
    '/auth',
    createAuthRouter({
      env: deps.env,
      authService: deps.authService,
      oauthService,
      redis: deps.redis,
    }),
  );

  router.use(
    '/users',
    authenticate,
    createUsersRouter({
      usersService: deps.usersService,
      gdprExportService,
      privacyService,
      jobQueue: deps.jobQueue,
    }),
  );

  router.use('/onboarding', authenticate, createOnboardingRouter(onboardingService));

  router.use('/exercises', authenticate, createExercisesRouter(exercisesService));

  router.use('/programs', authenticate, createProgramsRouter(programsService));

  router.use('/workouts', authenticate, createWorkoutsRouter(workoutsService));

  router.use('/sync', authenticate, createSyncRouter(syncService));

  router.use('/history', authenticate, createHistoryRouter(historyService));

  router.use('/analytics', authenticate, createAnalyticsRouter(analyticsService));

  router.use('/notifications', authenticate, createNotificationsRouter(pushService));

  return router;
}
