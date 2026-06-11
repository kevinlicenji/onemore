import type { PushSubscriptionInput } from '@onemore/shared';
import type { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

import type { Env } from '../../config/env.js';
import { parseUserSettings } from '../../lib/settings.js';
import type { Logger } from '../../lib/logger.js';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Web Push (VAPID) subscription management and delivery.
 */
export class PushService {
  private vapidConfigured = false;

  /**
   * @param prisma - Database client.
   * @param env - Application environment.
   * @param logger - Structured logger.
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly env: Env,
    private readonly logger: Logger,
  ) {
    if (this.env.VAPID_PUBLIC_KEY && this.env.VAPID_PRIVATE_KEY && this.env.VAPID_SUBJECT) {
      webpush.setVapidDetails(
        this.env.VAPID_SUBJECT,
        this.env.VAPID_PUBLIC_KEY,
        this.env.VAPID_PRIVATE_KEY,
      );
      this.vapidConfigured = true;
    }
  }

  /**
   * Whether VAPID keys are configured for push delivery.
   */
  isConfigured(): boolean {
    return this.vapidConfigured;
  }

  /**
   * Public VAPID key for browser subscription.
   */
  getPublicKey(): string | null {
    return this.env.VAPID_PUBLIC_KEY ?? null;
  }

  /**
   * Register or update a push subscription for the user.
   *
   * @param userId - Authenticated user id.
   * @param input - Browser push subscription keys.
   */
  async subscribe(userId: string, input: PushSubscriptionInput): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
      },
      update: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
      },
    });
  }

  /**
   * Remove a push subscription endpoint.
   *
   * @param userId - Authenticated user id.
   * @param endpoint - Push endpoint URL.
   */
  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  /**
   * Send a push notification to all user devices.
   *
   * @param userId - Target user id.
   * @param payload - Notification content.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured) {
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      return;
    }

    const settings = parseUserSettings(user.settings);
    if (!settings.notifications.workoutReminders) {
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? '/dashboard',
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          message,
        );
      } catch {
        this.logger.warn(
          { userId, subscriptionId: subscription.id },
          'Push delivery failed; removing stale subscription',
        );
        await this.prisma.pushSubscription.delete({ where: { id: subscription.id } });
      }
    }
  }

  /**
   * Send weekly workout reminders to users with no session this ISO week.
   */
  async sendWorkoutReminders(): Promise<number> {
    if (!this.vapidConfigured) {
      return 0;
    }

    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, onboardingCompletedAt: { not: null } },
      include: {
        workoutSessions: {
          where: {
            status: 'completed',
            completedAt: { gte: startOfUtcWeek() },
          },
          take: 1,
        },
        pushSubscriptions: { take: 1 },
      },
    });

    let sent = 0;
    for (const user of users) {
      const settings = parseUserSettings(user.settings);
      if (!settings.notifications.workoutReminders || user.pushSubscriptions.length === 0) {
        continue;
      }
      if (user.workoutSessions.length > 0) {
        continue;
      }

      await this.sendToUser(user.id, {
        title: 'Time to train?',
        body: 'You have not logged a workout this week yet.',
        url: '/workouts/start',
      });
      sent += 1;
    }

    return sent;
  }
}

function startOfUtcWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - (day - 1));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}
