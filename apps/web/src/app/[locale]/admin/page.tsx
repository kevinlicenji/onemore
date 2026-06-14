'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { GymListGroup } from '@/components/gym-ui/gym-list-group';
import { GymListRow } from '@/components/gym-ui/gym-list-row';
import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { RequireAdmin } from '@/components/require-admin';

export default function AdminHomePage(): React.ReactElement {
  const t = useTranslations('Admin');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'it';

  return (
    <RequireAdmin>
      <AdaptivePageShell
        backHref={`/${locale}/settings`}
        backLabel={t('backToSettings')}
        title={t('title')}
        description={t('subtitle')}
      >
        <GymListGroup>
          <GymListRow
            href={`/${locale}/admin/exercises`}
            title={t('exercisesLink')}
            subtitle={t('exercisesLinkHint')}
          />
          <GymListRow
            href={`/${locale}/admin/templates`}
            title={t('templatesLink')}
            subtitle={t('templatesLinkHint')}
          />
          <GymListRow
            href={`/${locale}/admin/users`}
            title={t('usersLink')}
            subtitle={t('usersLinkHint')}
          />
        </GymListGroup>
        <p className="text-xs text-muted-foreground">
          {t('hint')}{' '}
          <Link className="underline" href={`/${locale}/settings`}>
            {t('backToSettings')}
          </Link>
        </p>
      </AdaptivePageShell>
    </RequireAdmin>
  );
}
