'use client';

import { Suspense } from 'react';

import { AdaptivePageShell } from '@/components/layout/adaptive-page-shell';
import { NewProgramPageContent } from './new-program-content';

export default function NewProgramPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <AdaptivePageShell title="…">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </AdaptivePageShell>
      }
    >
      <NewProgramPageContent />
    </Suspense>
  );
}
