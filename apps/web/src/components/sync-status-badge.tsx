'use client';

import { Button } from '@onemore/ui';
import { useTranslations } from 'next-intl';

import { useSync } from '@/components/sync-provider';

/**
 * Non-blocking indicator for pending offline sync mutations.
 */
export function SyncStatusBadge(): React.ReactElement | null {
  const t = useTranslations('Sync');
  const { pendingCount, isSyncing, retrySync } = useSync();

  if (pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-center gap-2 rounded-full border bg-muted/50 px-3 py-2 text-xs">
      <span>{isSyncing ? t('syncing') : t('pending', { count: pendingCount })}</span>
      {!isSyncing && (
        <Button
          className="min-h-11 px-3 text-xs"
          type="button"
          variant="outline"
          onClick={() => {
            void retrySync();
          }}
        >
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
