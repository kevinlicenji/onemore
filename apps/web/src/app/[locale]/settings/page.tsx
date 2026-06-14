'use client';

import type { DataExportJob, UserSettings } from '@onemore/shared';
import { POSTHOG_EVENTS } from '@onemore/shared';
import { Button, Card, CardContent, cn } from '@onemore/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { ColorThemePicker } from '@/components/appearance/color-theme-picker';
import { FontPicker } from '@/components/appearance/font-picker';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useAuth } from '@/components/auth-provider';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { GymActionSheet } from '@/components/gym-ui/gym-action-sheet';
import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { GymToggleRow } from '@/components/gym-ui/gym-toggle-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { PageSection } from '@/components/layout/desktop/page-section';
import { RequireAuth } from '@/components/require-auth';
import { SettingsPersonalSection } from '@/components/settings-personal-section';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  changeUserPassword,
  deleteAccount,
  fetchLatestExportJob,
  logoutSession,
  patchUserProfile,
  requestDataExport,
} from '@/lib/api-auth';
import { trackEvent } from '@/lib/analytics';
import { subscribeToPushNotifications } from '@/lib/push-notifications';

type SettingsSection = 'profile' | 'appearance' | 'motivation' | 'notifications' | 'account';

export default function SettingsPage(): React.ReactElement {
  const t = useTranslations('Settings');
  const { accessToken, clearSession, profile, setProfile } = useAuth();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const isDesktop = useIsDesktop();

  const [exportJob, setExportJob] = useState<DataExportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const loadExportJob = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      return;
    }
    const latestExport = await fetchLatestExportJob(accessToken);
    setExportJob(latestExport);
  }, [accessToken]);

  useEffect(() => {
    void loadExportJob().catch(() => {
      setError(t('loadError'));
    });
  }, [loadExportJob, t]);

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

  async function handleSaveProfile(payload: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<void> {
    if (!accessToken || !profile) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await patchUserProfile(accessToken, payload);
      setProfile(updated);
      trackEvent(POSTHOG_EVENTS.SETTINGS_UPDATED, { section: 'personal' });
      setMessage(t('saved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await changeUserPassword(accessToken, payload);
      trackEvent(POSTHOG_EVENTS.SETTINGS_UPDATED, { section: 'password' });
      setMessage(t('passwordChanged'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordChangeError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      await logoutSession();
      clearSession();
      router.push(`/${locale}/login`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('logoutError'));
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
    if (!accessToken) {
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
      setDeleteConfirmOpen(false);
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
      <LocaleSwitcher />
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

  const personalSection = (
    <SettingsPersonalSection
      loading={loading}
      profile={profile}
      onChangePassword={handleChangePassword}
      onSaveProfile={handleSaveProfile}
    />
  );

  const sectionTabs: Array<{ id: SettingsSection; label: string }> = [
    { id: 'profile', label: t('personalTitle') },
    { id: 'appearance', label: t('appearanceTitle') },
    { id: 'motivation', label: t('motivationTitle') },
    { id: 'notifications', label: t('notificationsTitle') },
    { id: 'account', label: t('accountTitle') },
  ];

  const motivationSection = (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((level) => (
        <GymListRow
          key={level}
          disabled={loading}
          showChevron={false}
          title={t(`motivationLevel${String(level)}`)}
          trailing={
            profile.motivationLevel === level ? (
              <span aria-hidden className="text-primary">
                ✓
              </span>
            ) : null
          }
          onClick={() => {
            void handleMotivationChange(level);
          }}
        />
      ))}
    </div>
  );

  const notificationsSection = isDesktop ? (
    <div className="space-y-4 text-sm">
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
    </div>
  ) : (
    <GymListGroup>
      <li className="border-t border-gym-separator first:border-t-0">
        <GymToggleRow
          checked={notifications.workoutReminders}
          disabled={loading}
          label={t('workoutReminders')}
          onChange={(checked) => {
            void saveNotifications({ workoutReminders: checked });
          }}
        />
      </li>
      <li className="border-t border-gym-separator">
        <GymToggleRow
          checked={notifications.progressUpdates}
          disabled={loading}
          label={t('progressUpdates')}
          onChange={(checked) => {
            void saveNotifications({ progressUpdates: checked });
          }}
        />
      </li>
      <li className="border-t border-gym-separator">
        <GymToggleRow
          checked={notifications.prCelebrations}
          disabled={loading}
          label={t('prCelebrations')}
          onChange={(checked) => {
            void saveNotifications({ prCelebrations: checked });
          }}
        />
      </li>
      <li className="border-t border-gym-separator p-3">
        <Button
          className="min-h-11 w-full"
          disabled={loading}
          type="button"
          variant="outline"
          onClick={() => {
            void handleEnablePush();
          }}
        >
          {t('enablePush')}
        </Button>
      </li>
    </GymListGroup>
  );

  const accountSection = isDesktop ? (
    <div>
      {isAdmin ? (
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href={`/${locale}/admin`}>{t('adminConsole')}</Link>
          </Button>
        </div>
      ) : null}
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
          variant="outline"
          onClick={() => {
            void handleLogout();
          }}
        >
          {t('logout')}
        </Button>
        <Button
          disabled={loading}
          type="button"
          variant="destructive"
          onClick={() => {
            setDeleteConfirmOpen(true);
          }}
        >
          {t('deleteAccount')}
        </Button>
      </div>
    </div>
  ) : (
    <GymListGroup>
      {isAdmin ? (
        <GymListRow href={`/${locale}/admin`} title={t('adminConsole')} />
      ) : null}
      {exportJob ? (
        <li className="border-b border-gym-separator px-4 py-3 text-sm text-muted-foreground">
          {t('exportStatus', { status: exportJob.status })}
        </li>
      ) : null}
      <GymListRow
        showChevron={false}
        title={t('requestExport')}
        onClick={() => {
          void handleExport();
        }}
      />
      <GymListRow
        disabled={loading}
        showChevron={false}
        title={t('logout')}
        onClick={() => {
          void handleLogout();
        }}
      />
      <GymListRow
        showChevron={false}
        title={t('deleteAccount')}
        onClick={() => {
          setDeleteConfirmOpen(true);
        }}
      />
    </GymListGroup>
  );

  const activeSectionContent = (() => {
    switch (activeSection) {
      case 'profile':
        return personalSection;
      case 'appearance':
        return appearancePickers;
      case 'motivation':
        return motivationSection;
      case 'notifications':
        return notificationsSection;
      case 'account':
        return accountSection;
      default:
        return personalSection;
    }
  })();

  const activeSectionMeta = sectionTabs.find((tab) => tab.id === activeSection);

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

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                'shrink-0 rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                activeSection === tab.id
                  ? 'border-primary bg-primary/10 font-semibold text-foreground'
                  : 'border-gym-separator bg-card text-muted-foreground hover:bg-muted/40',
              )}
              type="button"
              onClick={() => {
                setActiveSection(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isDesktop ? (
          <PageSection
            className="lg:col-span-2"
            description={
              activeSection === 'profile'
                ? t('personalSubtitle')
                : activeSection === 'appearance'
                  ? t('appearanceSubtitle')
                  : activeSection === 'motivation'
                    ? t('motivationSubtitle')
                    : activeSection === 'account'
                      ? t('exportHelp')
                      : undefined
            }
            title={activeSectionMeta?.label ?? t('title')}
          >
            <Card>
              <CardContent className="p-6">{activeSectionContent}</CardContent>
            </Card>
          </PageSection>
        ) : (
          <GymListGroup title={activeSectionMeta?.label}>
            <li className="p-4">{activeSectionContent}</li>
          </GymListGroup>
        )}

        <GymActionSheet
          cancelLabel={t('cancel')}
          confirmLabel={t('deleteAccount')}
          destructive
          loading={loading}
          message={t('deleteConfirm')}
          open={deleteConfirmOpen}
          title={t('deleteAccount')}
          onCancel={() => {
            setDeleteConfirmOpen(false);
          }}
          onConfirm={() => {
            void handleDeleteAccount();
          }}
        />
      </AdaptivePageShell>
    </RequireAuth>
  );
}
