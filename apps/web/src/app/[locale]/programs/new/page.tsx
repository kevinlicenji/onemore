'use client';

import { Suspense } from 'react';

import { NewProgramPageContent } from './new-program-content';

export default function NewProgramPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <NewProgramPageContent />
    </Suspense>
  );
}
