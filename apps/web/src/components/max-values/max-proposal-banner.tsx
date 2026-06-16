'use client';

import type { PendingMaxProposal } from '@onemore/shared';
import { Button } from '@onemore/ui';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface MaxProposalBannerProps {
  proposal: PendingMaxProposal;
  locale: string;
  onDismiss: () => void;
}

/**
 * In-workout banner when a new 1RM proposal is created server-side.
 */
export function MaxProposalBanner({
  proposal,
  locale,
  onDismiss,
}: MaxProposalBannerProps): React.ReactElement {
  const t = useTranslations('MaxValues');

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <p className="text-sm font-semibold">{t('proposalTitle')}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('proposalBody', {
          exercise: proposal.exerciseName,
          weight: proposal.weight,
          reps: proposal.reps,
          e1rm: proposal.calculated1RM,
        })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" type="button">
          <Link href={`/${locale}/max-values`}>{t('reviewProposal')}</Link>
        </Button>
        <Button size="sm" type="button" variant="ghost" onClick={onDismiss}>
          {t('dismissProposal')}
        </Button>
      </div>
    </div>
  );
}
