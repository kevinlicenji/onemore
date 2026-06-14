'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuth } from '@/components/auth-provider';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAdmin } from '@/components/require-admin';
import { ThemedTextInput } from '@/components/themed-text-input';
import { findAdminUserByUsername, setUserAdmin } from '@/lib/admin-api';

export default function AdminUsersPage(): React.ReactElement {
  const t = useTranslations('Admin');
  const { accessToken } = useAuth();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  const [username, setUsername] = useState('');
  const [foundUser, setFoundUser] = useState<{
    id: string;
    username: string | null;
    isAdmin: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSearch(): Promise<void> {
    if (!accessToken || username.trim().length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    setFoundUser(null);
    try {
      const user = await findAdminUserByUsername(accessToken, username.trim().toLowerCase());
      setFoundUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('userNotFound'));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAdmin(next: boolean): Promise<void> {
    if (!accessToken || !foundUser) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await setUserAdmin(accessToken, foundUser.id, next);
      setFoundUser(updated);
      setMessage(next ? t('adminGranted') : t('adminRevoked'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAdmin>
      <AdaptivePageShell
        backHref={`/${locale}/admin`}
        backLabel={t('backToAdmin')}
        description={t('usersSubtitle')}
        title={t('usersTitle')}
      >
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t('username')}
            <ThemedTextInput
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
          </label>
          <Button disabled={loading} type="button" onClick={() => void handleSearch()}>
            {t('searchUser')}
          </Button>
          {foundUser ? (
            <div className="rounded-lg border p-4 text-sm">
              <p>
                <span className="font-medium">{t('username')}:</span> {foundUser.username}
              </p>
              <p>
                <span className="font-medium">{t('adminStatus')}:</span>{' '}
                {foundUser.isAdmin ? t('adminYes') : t('adminNo')}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  disabled={loading || foundUser.isAdmin}
                  type="button"
                  onClick={() => {
                    void handleToggleAdmin(true);
                  }}
                >
                  {t('grantAdmin')}
                </Button>
                <Button
                  disabled={loading || !foundUser.isAdmin}
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    void handleToggleAdmin(false);
                  }}
                >
                  {t('revokeAdmin')}
                </Button>
              </div>
            </div>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/${locale}/admin`}>{t('backToAdmin')}</Link>
          </Button>
        </div>
      </AdaptivePageShell>
    </RequireAdmin>
  );
}
