'use client';

import type { UserProfile } from '@onemore/shared';
import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { GymAuthField } from '@/components/gym-ui/gym-auth-field';

interface SettingsPersonalSectionProps {
  profile: UserProfile;
  loading: boolean;
  onSaveProfile: (payload: {
    firstName: string;
    lastName: string;
    email: string;
  }) => Promise<void>;
  onChangePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}

/**
 * Personal profile fields: name, read-only username, email, and password change.
 */
export function SettingsPersonalSection({
  profile,
  loading,
  onSaveProfile,
  onChangePassword,
}: SettingsPersonalSectionProps): React.ReactElement {
  const t = useTranslations('Settings');
  const [firstName, setFirstName] = useState(profile.firstName ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(profile.firstName ?? '');
    setLastName(profile.lastName ?? '');
    setEmail(profile.email);
  }, [profile.email, profile.firstName, profile.lastName]);

  async function handleSaveProfile(): Promise<void> {
    setLocalError(null);
    await onSaveProfile({ firstName, lastName, email });
  }

  async function handleChangePassword(): Promise<void> {
    setLocalError(null);
    if (newPassword !== confirmPassword) {
      setLocalError(t('passwordMismatch'));
      return;
    }
    await onChangePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <GymAuthField
          autoComplete="given-name"
          disabled={loading}
          label={t('firstName')}
          maxLength={50}
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value);
          }}
          required
        />
        <GymAuthField
          autoComplete="family-name"
          disabled={loading}
          label={t('lastName')}
          maxLength={50}
          value={lastName}
          onChange={(event) => {
            setLastName(event.target.value);
          }}
          required
        />
      </div>

      <GymAuthField
        autoComplete="username"
        disabled
        hint={t('usernameReadOnlyHint')}
        label={t('username')}
        readOnly
        value={profile.username ?? ''}
      />

      <GymAuthField
        autoComplete="email"
        disabled={loading}
        label={t('email')}
        type="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
        }}
        required
      />

      <Button
        className="min-h-11 w-full sm:w-auto"
        disabled={loading}
        type="button"
        onClick={() => {
          void handleSaveProfile();
        }}
      >
        {t('saveProfile')}
      </Button>

      <div className="border-t border-gym-separator pt-5">
        <p className="text-sm font-medium">{t('changePasswordTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('changePasswordHint')}</p>
        <div className="mt-4 flex flex-col gap-4">
          <GymAuthField
            autoComplete="current-password"
            disabled={loading}
            label={t('currentPassword')}
            type="password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
            }}
          />
          <GymAuthField
            autoComplete="new-password"
            disabled={loading}
            label={t('newPassword')}
            minLength={8}
            type="password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
            }}
          />
          <GymAuthField
            autoComplete="new-password"
            disabled={loading}
            label={t('confirmNewPassword')}
            minLength={8}
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
            }}
          />
          {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
          <Button
            className="min-h-11 w-full sm:w-auto"
            disabled={loading || currentPassword.length === 0 || newPassword.length === 0}
            type="button"
            variant="outline"
            onClick={() => {
              void handleChangePassword();
            }}
          >
            {t('changePassword')}
          </Button>
        </div>
      </div>
    </div>
  );
}
