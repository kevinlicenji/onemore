'use client';

import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AuthErrorMessage } from '@/components/auth/auth-error-message';
import { AuthPageContent } from '@/components/auth/auth-page-content';
import { GymAuthField } from '@/components/gym-ui/gym-auth-field';
import { GymMobileActions } from '@/components/gym-ui/gym-mobile-actions';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { API_BASE_URL } from '@/lib/api-config';

export default function ForgotPasswordPage(): React.ReactElement {
  const t = useTranslations('Auth');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError(t('forgotError'));
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdaptivePageShell
      backHref={`/${locale}/login`}
      backLabel={t('goLogin')}
      description={t('forgotSubtitle')}
      title={t('forgotTitle')}
      variant="centered"
    >
      <AuthPageContent
        footer={
          <GymMobileActions>
            <Button asChild variant="outline">
              <Link href={`/${locale}/login`}>{t('goLogin')}</Link>
            </Button>
          </GymMobileActions>
        }
      >
        {sent ? (
          <p className="text-pretty text-center text-sm leading-relaxed text-muted-foreground">
            {t('forgotSuccess')}
          </p>
        ) : (
          <form
            className="flex w-full flex-col gap-4"
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
          >
            <GymAuthField
              autoComplete="email"
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              required
            />
            {error ? <AuthErrorMessage message={error} /> : null}
            <Button className="min-h-11 w-full text-base" disabled={loading} type="submit">
              {t('forgotSubmit')}
            </Button>
          </form>
        )}
      </AuthPageContent>
    </AdaptivePageShell>
  );
}
