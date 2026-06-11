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
    <div className="flex items-center justify-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs">
      <span>{isSyncing ? t('syncing') : t('pending', { count: pendingCount })}</span>
      {!isSyncing && (
        <Button
          className="h-6 px-2 text-xs"
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
