'use client';

import type { DataExportJob, UserProfile, UserSettings } from '@onemore/shared';
import { POSTHOG_EVENTS } from '@onemore/shared';
import { Button, Card, CardContent } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { AppearanceModePicker } from '@/components/appearance/appearance-mode-picker';
import { ColorThemePicker } from '@/components/appearance/color-theme-picker';
import { FontPicker } from '@/components/appearance/font-picker';
import { useAuth } from '@/components/auth-provider';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { PageSection } from '@/components/layout/desktop/page-section';
import { RequireAuth } from '@/components/require-auth';
import { useIsDesktop } from '@/hooks/use-is-desktop';
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
  const isDesktop = useIsDesktop();

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
        <AdaptivePageShell title={t('title')}>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </AdaptivePageShell>
      </RequireAuth>
    );
  }

  const notifications = profile.settings.notifications;

  const headerActions = isDesktop ? (
    <Button asChild size="sm" variant="outline">
      <Link href={`/${locale}/exercises`}>{t('exercisesLink')}</Link>
    </Button>
  ) : null;

  const appearancePickers = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('appearanceModeLabel')}</span>
        <AppearanceModePicker />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('colorThemeLabel')}</span>
        <ColorThemePicker />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('fontLabel')}</span>
        <FontPicker />
      </div>
    </div>
  );

  return (
    <RequireAuth>
      <AdaptivePageShell
        backHref={isDesktop ? undefined : `/${locale}/dashboard`}
        backLabel={t('backToDashboard')}
        title={t('title')}
        actions={headerActions}
      >
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!isDesktop ? (
          <GymListGroup title={t('appearanceTitle')}>
            <li className="p-4">{appearancePickers}</li>
          </GymListGroup>
        ) : (
          <PageSection
            title={t('appearanceTitle')}
            description={t('appearanceSubtitle')}
            className="lg:col-span-2"
          >
            <Card>
              <CardContent className="p-6">{appearancePickers}</CardContent>
            </Card>
          </PageSection>
        )}

        <div className={isDesktop ? 'grid gap-6 lg:grid-cols-2' : 'flex flex-col gap-6'}>
          <PageSection title={t('motivationTitle')} description={t('motivationSubtitle')}>
            <Card>
              <CardContent className="flex flex-wrap gap-2 p-6">
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
              </CardContent>
            </Card>
          </PageSection>

          <PageSection title={t('notificationsTitle')}>
            <Card>
              <CardContent className="space-y-4 p-6 text-sm">
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
                <Button
                  disabled={loading}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void handleEnablePush();
                  }}
                >
                  {t('enablePush')}
                </Button>
              </CardContent>
            </Card>
          </PageSection>

          <PageSection
            title={t('privacyTitle')}
            description={t('exportHelp')}
            className={isDesktop ? 'lg:col-span-2' : undefined}
          >
            <Card>
              <CardContent className="p-6">
                {exportJob ? (
                  <p className="text-sm text-muted-foreground">
                    {t('exportStatus', { status: exportJob.status })}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
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
                    disabled={loading}
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      void handleDeleteAccount();
                    }}
                  >
                    {t('deleteAccount')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PageSection>
        </div>
      </AdaptivePageShell>
    </RequireAuth>
  );
}
