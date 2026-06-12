'use client';

import type { DataExportJob, UserProfile, UserSettings } from '@onemore/shared';
import { POSTHOG_EVENTS } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import {
  deleteAccount,
  fetchLatestExportJob,
  fetchUserProfile,
  patchUserProfile,
  requestDataExport,
} from '@/lib/api-auth';
import { trackEvent } from '@/lib/analytics';
import { subscribeToPushNotifications } from '@/lib/push-notifications';

export default function SettingsPage(): React.ReactElement {
  const t = useTranslations('Settings');
  const { accessToken, clearSession } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [exportJob, setExportJob] = useState<DataExportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    const [user, latestExport] = await Promise.all([
      fetchUserProfile(accessToken),
      fetchLatestExportJob(accessToken),
    ]);
    setProfile(user);
    setExportJob(latestExport);
  }, [accessToken]);

  useEffect(() => {
    void load().catch(() => {
      setError(t('loadError'));
    });
  }, [load, t]);

  async function saveNotifications(patch: Partial<UserSettings['notifications']>): Promise<void> {
    if (!accessToken || !profile) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await patchUserProfile(accessToken, {
        settings: { notifications: patch },
      });
      setProfile(updated);
      trackEvent(POSTHOG_EVENTS.SETTINGS_UPDATED, { section: 'notifications' });
      setMessage(t('saved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleMotivationChange(level: number): Promise<void> {
    if (!accessToken || !profile) {
      return;
    }
    setLoading(true);
    try {
      const updated = await patchUserProfile(accessToken, { motivationLevel: level });
      setProfile(updated);
      trackEvent(POSTHOG_EVENTS.SETTINGS_UPDATED, { section: 'motivation' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(): Promise<void> {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { job } = await requestDataExport(accessToken);
      setExportJob(job);
      trackEvent(POSTHOG_EVENTS.DATA_EXPORT_REQUESTED, {});
      setMessage(t('exportStarted'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('exportError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    if (!accessToken || !window.confirm(t('deleteConfirm'))) {
      return;
    }
    setLoading(true);
    try {
      await deleteAccount(accessToken);
      trackEvent(POSTHOG_EVENTS.ACCOUNT_DELETION_REQUESTED, {});
      clearSession();
      router.push(`/${locale}/login`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleEnablePush(): Promise<void> {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    try {
      const ok = await subscribeToPushNotifications(accessToken);
      if (ok) {
        trackEvent(POSTHOG_EVENTS.PUSH_SUBSCRIBED, {});
        setMessage(t('pushEnabled'));
      } else {
        setError(t('pushError'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pushError'));
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-lg p-6">
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </main>
      </RequireAuth>
    );
  }

  const notifications = profile.settings.notifications;

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <Button asChild className="w-fit" size="sm" variant="outline">
            <Link href={`/${locale}/exercises`}>{t('exercisesLink')}</Link>
          </Button>
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">{t('motivationTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('motivationSubtitle')}</p>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3].map((level) => (
              <Button
                key={level}
                disabled={loading}
                type="button"
                variant={profile.motivationLevel === level ? 'default' : 'outline'}
                onClick={() => {
                  void handleMotivationChange(level);
                }}
              >
                {t(`motivationLevel${String(level)}`)}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">{t('notificationsTitle')}</h2>
          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-center justify-between gap-4">
              {t('workoutReminders')}
              <input
                checked={notifications.workoutReminders}
                disabled={loading}
                type="checkbox"
                onChange={(e) => {
                  void saveNotifications({ workoutReminders: e.target.checked });
                }}
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              {t('progressUpdates')}
              <input
                checked={notifications.progressUpdates}
                disabled={loading}
                type="checkbox"
                onChange={(e) => {
                  void saveNotifications({ progressUpdates: e.target.checked });
                }}
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              {t('prCelebrations')}
              <input
                checked={notifications.prCelebrations}
                disabled={loading}
                type="checkbox"
                onChange={(e) => {
                  void saveNotifications({ prCelebrations: e.target.checked });
                }}
              />
            </label>
          </div>
          <Button
            className="mt-4"
            disabled={loading}
            type="button"
            variant="outline"
            onClick={() => {
              void handleEnablePush();
            }}
          >
            {t('enablePush')}
          </Button>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-semibold">{t('privacyTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('exportHelp')}</p>
          {exportJob && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('exportStatus', { status: exportJob.status })}
            </p>
          )}
          <Button
            className="mt-3"
            disabled={loading}
            type="button"
            variant="outline"
            onClick={() => {
              void handleExport();
            }}
          >
            {t('requestExport')}
          </Button>
          <Button
            className="mt-3 w-full text-red-600"
            disabled={loading}
            type="button"
            variant="outline"
            onClick={() => {
              void handleDeleteAccount();
            }}
          >
            {t('deleteAccount')}
          </Button>
        </section>
      </main>
    </RequireAuth>
  );
}
